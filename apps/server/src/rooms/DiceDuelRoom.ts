import { randomInt } from "node:crypto";
import { Client, Room } from "colyseus";
import {
  CLIENT_MESSAGES,
  RECONNECT_SECONDS,
  SERVER_MESSAGES,
  applyMove,
  determineWinner,
  isColumnIndex,
  isGameFinished,
  type ColumnIndex,
  type DieValue,
} from "@pixel-dice-duel/shared";
import { createRoomCode, releaseRoomCode } from "../services/roomRegistry.js";
import { validateNickname } from "../utils/validation.js";
import { DiceRoomState, PlayerSchema, resetPlayer, schemaToBoard, writeBoard } from "./schema.js";

interface JoinOptions { nickname?: unknown }
interface PlaceDiePayload { column?: unknown }

export class DiceDuelRoom extends Room<{ state: DiceRoomState }> {
  override maxClients = 2;
  private processingMove = false;
  private voluntaryLeaves = new Set<string>();
  private lastMessageAt = new Map<string, number>();

  override onCreate(): void {
    this.setState(new DiceRoomState());
    this.state.roomCode = createRoomCode(this.roomId);
    this.setMetadata({ roomCode: this.state.roomCode });
    this.setPrivate(true);

    this.onMessage(CLIENT_MESSAGES.PLACE_DIE, (client, payload: PlaceDiePayload) => this.handleMove(client, payload));
    this.onMessage(CLIENT_MESSAGES.REQUEST_REMATCH, (client) => this.handleRematch(client));
    this.onMessage(CLIENT_MESSAGES.DECLINE_REMATCH, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || this.state.status === "PLAYING") return;
      player.rematch = false;
      this.broadcast(SERVER_MESSAGES.REMATCH_DECLINED, { nickname: player.nickname });
    });
    this.onMessage(CLIENT_MESSAGES.LEAVE_MATCH, (client) => {
      this.voluntaryLeaves.add(client.sessionId);
      if (this.state.status === "PLAYING") this.finishByForfeit(client.sessionId, "forfeit");
      client.leave(1000);
    });
    console.info(`[room] created ${this.state.roomCode}`);
  }

  override onAuth(_client: Client, options: JoinOptions): boolean {
    try {
      validateNickname(options.nickname);
      return true;
    } catch {
      return false;
    }
  }

  override onJoin(client: Client, options: JoinOptions): void {
    if (this.state.status !== "WAITING" || this.state.players.size >= 2) {
      throw new Error("A sala não aceita novos jogadores.");
    }
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.nickname = validateNickname(options.nickname);
    this.state.players.set(client.sessionId, player);
    console.info(`[room ${this.state.roomCode}] player joined: ${player.nickname}`);
    if (this.state.players.size === 2) this.startMatch();
  }

  private rollDie(): DieValue {
    return randomInt(1, 7) as DieValue;
  }

  private startMatch(): void {
    const players = [...this.state.players.values()];
    players.forEach(resetPlayer);
    this.state.status = "PLAYING";
    this.state.winnerId = "";
    this.state.finishReason = "";
    this.state.currentTurnPlayerId = players[randomInt(players.length)]!.id;
    this.state.currentDie = this.rollDie();
    this.state.turnRevision += 1;
    console.info(`[room ${this.state.roomCode}] match started`);
  }

  private rateLimited(client: Client): boolean {
    const now = Date.now();
    const previous = this.lastMessageAt.get(client.sessionId) ?? 0;
    this.lastMessageAt.set(client.sessionId, now);
    return now - previous < 120;
  }

  private reject(client: Client, reason: string): void {
    client.send(SERVER_MESSAGES.MOVE_REJECTED, { reason });
  }

  private handleMove(client: Client, payload: PlaceDiePayload): void {
    if (this.processingMove || this.rateLimited(client)) return this.reject(client, "Aguarde a jogada anterior.");
    if (this.state.status !== "PLAYING") return this.reject(client, "A partida não está em andamento.");
    if (this.state.currentTurnPlayerId !== client.sessionId) return this.reject(client, "Ainda não é o seu turno.");
    if (typeof payload?.column !== "number" || !isColumnIndex(payload.column)) return this.reject(client, "Coluna inválida.");

    const active = this.state.players.get(client.sessionId);
    const opponent = [...this.state.players.values()].find((player) => player.id !== client.sessionId);
    if (!active || !opponent) return this.reject(client, "Adversário indisponível.");

    this.processingMove = true;
    try {
      const result = applyMove(
        schemaToBoard(active),
        schemaToBoard(opponent),
        this.state.currentDie as DieValue,
        payload.column as ColumnIndex,
      );
      writeBoard(active, result.ownBoard);
      writeBoard(opponent, result.opponentBoard);
      active.score = result.ownScore;
      opponent.score = result.opponentScore;

      if (isGameFinished(result.ownBoard)) {
        this.finishByScore(active, opponent);
      } else {
        this.state.currentTurnPlayerId = opponent.id;
        this.state.currentDie = this.rollDie();
        this.state.turnRevision += 1;
      }
    } catch (error) {
      this.reject(client, error instanceof Error ? error.message : "Jogada inválida.");
    } finally {
      this.processingMove = false;
    }
  }

  private finishByScore(active: PlayerSchema, opponent: PlayerSchema): void {
    const result = determineWinner(active.score, opponent.score);
    this.state.status = "FINISHED";
    this.state.currentTurnPlayerId = "";
    this.state.finishReason = "score";
    this.state.winnerId = result === "DRAW" ? "DRAW" : result === "PLAYER_ONE" ? active.id : opponent.id;
    console.info(`[room ${this.state.roomCode}] match finished (${this.state.winnerId})`);
  }

  private finishByForfeit(leaverId: string, reason: "forfeit" | "disconnect"): void {
    const opponent = [...this.state.players.values()].find((player) => player.id !== leaverId);
    this.state.status = "FINISHED";
    this.state.currentTurnPlayerId = "";
    this.state.finishReason = reason;
    this.state.winnerId = opponent?.id ?? "";
    console.info(`[room ${this.state.roomCode}] match finished by ${reason}`);
  }

  private handleRematch(client: Client): void {
    if (this.state.status !== "FINISHED" && this.state.status !== "REMATCH_WAITING") return;
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.rematch = true;
    this.state.status = "REMATCH_WAITING";
    const players = [...this.state.players.values()];
    if (players.length === 2 && players.every((entry) => entry.rematch && entry.connected)) this.startMatch();
  }

  override async onLeave(client: Client, _code?: number): Promise<void> {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.connected = false;
    console.info(`[room ${this.state.roomCode}] player disconnected: ${player.nickname}`);

    if (this.voluntaryLeaves.has(client.sessionId)) {
      if (this.state.status === "PLAYING") this.finishByForfeit(client.sessionId, "forfeit");
      return;
    }

    try {
      await this.allowReconnection(client, RECONNECT_SECONDS);
      player.connected = true;
      console.info(`[room ${this.state.roomCode}] player reconnected: ${player.nickname}`);
    } catch {
      if (this.state.status === "PLAYING") this.finishByForfeit(client.sessionId, "disconnect");
    }
  }

  override onDispose(): void {
    releaseRoomCode(this.state.roomCode);
    console.info(`[room] disposed ${this.state.roomCode}`);
  }
}
