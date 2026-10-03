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
import { validateCoinBalance, validateNickname, validateWager } from "../utils/validation.js";
import { DiceRoomState, PlayerSchema, resetPlayer, schemaToBoard, writeBoard } from "./schema.js";

interface JoinOptions { nickname?: unknown; coins?: unknown; wager?: unknown }
interface PlaceDiePayload { column?: unknown }
interface WagerPayload { amount?: unknown }

export class DiceDuelRoom extends Room<{ state: DiceRoomState }> {
  override maxClients = 2;
  private processingMove = false;
  private voluntaryLeaves = new Set<string>();
  private lastMessageAt = new Map<string, number>();

  override onCreate(options: JoinOptions): void {
    this.setState(new DiceRoomState());
    this.state.wager = validateWager(options.wager ?? 0);
    this.state.roomCode = createRoomCode(this.roomId, this.state.wager);
    this.setMetadata({ roomCode: this.state.roomCode, wager: this.state.wager });
    this.setPrivate(true);

    this.onMessage(CLIENT_MESSAGES.PLACE_DIE, (client, payload: PlaceDiePayload) => this.handleMove(client, payload));
    this.onMessage(CLIENT_MESSAGES.REQUEST_REMATCH, (client) => this.handleRematch(client));
    this.onMessage(CLIENT_MESSAGES.PROPOSE_WAGER, (client, payload: WagerPayload) => this.handleWagerProposal(client, payload));
    this.onMessage(CLIENT_MESSAGES.ACCEPT_WAGER, (client) => this.handleWagerAcceptance(client));
    this.onMessage(CLIENT_MESSAGES.DECLINE_WAGER, (client) => this.handleWagerDecline(client));
    this.onMessage(CLIENT_MESSAGES.DECLINE_REMATCH, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || this.state.status === "PLAYING") return;
      this.state.players.forEach((entry) => { entry.rematch = false; });
      this.state.status = "FINISHED";
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
      validateCoinBalance(options.coins);
      return true;
    } catch {
      return false;
    }
  }

  override onJoin(client: Client, options: JoinOptions): void {
    if (this.state.status !== "WAITING" || this.state.players.size >= 2) {
      throw new Error("A sala não aceita novos jogadores.");
    }
    const coins = validateCoinBalance(options.coins);
    if (coins < this.state.wager) throw new Error(`Você precisa de ${this.state.wager} moedas para entrar nesta sala.`);

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.nickname = validateNickname(options.nickname);
    player.coins = coins;
    this.state.players.set(client.sessionId, player);
    if (!this.state.hostPlayerId) this.state.hostPlayerId = client.sessionId;
    console.info(`[room ${this.state.roomCode}] player joined: ${player.nickname}`);
    if (this.state.players.size === 2) this.startMatch();
  }

  private rollDie(): DieValue {
    return randomInt(1, 7) as DieValue;
  }

  private startMatch(wager = this.state.wager): void {
    const players = [...this.state.players.values()];
    if (players.length !== 2) return;
    if (players.some((player) => player.coins < wager)) {
      this.state.status = "WAGER_SETUP";
      this.broadcast(SERVER_MESSAGES.NOTICE, { message: "Um dos jogadores não possui moedas suficientes para essa aposta." });
      return;
    }

    players.forEach(resetPlayer);
    this.state.wager = wager;
    this.state.pot = wager * players.length;
    this.state.proposedWager = -1;
    this.state.wagerProposalBy = "";
    if (wager > 0) players.forEach((player) => { player.coins -= wager; });
    this.state.status = "PLAYING";
    this.state.winnerId = "";
    this.state.finishReason = "";
    this.state.currentTurnPlayerId = players[randomInt(players.length)]!.id;
    this.state.currentDie = this.rollDie();
    this.state.turnRevision += 1;
    this.state.round += 1;
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
    this.settleWager();
    console.info(`[room ${this.state.roomCode}] match finished (${this.state.winnerId})`);
  }

  private finishByForfeit(leaverId: string, reason: "forfeit" | "disconnect"): void {
    const opponent = [...this.state.players.values()].find((player) => player.id !== leaverId);
    this.state.status = "FINISHED";
    this.state.currentTurnPlayerId = "";
    this.state.finishReason = reason;
    this.state.winnerId = opponent?.id ?? "";
    this.settleWager();
    console.info(`[room ${this.state.roomCode}] match finished by ${reason}`);
  }

  private settleWager(): void {
    if (this.state.pot <= 0) return;
    if (this.state.winnerId === "DRAW") {
      this.state.players.forEach((player) => { player.coins += this.state.wager; });
      return;
    }
    const winner = this.state.players.get(this.state.winnerId);
    if (winner) winner.coins += this.state.pot;
  }

  private handleRematch(client: Client): void {
    if (this.state.status !== "FINISHED" && this.state.status !== "REMATCH_WAITING") return;
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.rematch = true;
    this.state.status = "REMATCH_WAITING";
    const players = [...this.state.players.values()];
    if (players.length !== 2 || !players.every((entry) => entry.rematch && entry.connected)) return;
    if (this.state.wager > 0) {
      players.forEach((entry) => { entry.rematch = false; });
      this.state.status = "WAGER_SETUP";
      this.state.proposedWager = -1;
      this.state.wagerProposalBy = "";
      return;
    }
    this.startMatch(0);
  }

  private handleWagerProposal(client: Client, payload: WagerPayload): void {
    if (this.state.status !== "WAGER_SETUP") return this.reject(client, "A próxima partida ainda não pode ser configurada.");
    if (client.sessionId !== this.state.hostPlayerId) return this.reject(client, "Apenas o criador da sala pode definir a próxima aposta.");
    let amount: number;
    try {
      amount = validateWager(payload?.amount);
    } catch (error) {
      return this.reject(client, error instanceof Error ? error.message : "Aposta inválida.");
    }
    const players = [...this.state.players.values()];
    if (players.some((player) => player.coins < amount)) {
      return this.reject(client, "Um dos jogadores não possui moedas suficientes para essa aposta.");
    }
    this.state.proposedWager = amount;
    this.state.wagerProposalBy = client.sessionId;
    this.broadcast(SERVER_MESSAGES.NOTICE, {
      message: amount > 0 ? `Nova aposta proposta: ${amount} moedas por jogador.` : "Foi proposta uma partida sem aposta.",
    });
  }

  private handleWagerAcceptance(client: Client): void {
    if (this.state.status !== "WAGER_SETUP" || this.state.proposedWager < 0) return this.reject(client, "Não existe uma aposta aguardando resposta.");
    if (client.sessionId === this.state.wagerProposalBy) return this.reject(client, "A proposta precisa ser aceita pelo adversário.");
    this.startMatch(this.state.proposedWager);
  }

  private handleWagerDecline(client: Client): void {
    if (this.state.status !== "WAGER_SETUP" || this.state.proposedWager < 0) return;
    if (client.sessionId === this.state.wagerProposalBy) return;
    const player = this.state.players.get(client.sessionId);
    this.state.proposedWager = -1;
    this.state.wagerProposalBy = "";
    this.broadcast(SERVER_MESSAGES.WAGER_DECLINED, { nickname: player?.nickname ?? "O adversário" });
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
