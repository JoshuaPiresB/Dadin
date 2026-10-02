import { Client, Room } from "@colyseus/sdk";
import type { Board, DieValue, GameStatus, OnlineGameSnapshot, PlayerSnapshot } from "@pixel-dice-duel/shared";

interface NetworkColumn { dice: Iterable<number> }
interface NetworkPlayer {
  id: string; nickname: string; connected: boolean; score: number; rematch: boolean;
  columns: Iterable<NetworkColumn>;
}
interface NetworkState {
  roomCode: string; status: string; currentTurnPlayerId: string; currentDie: number;
  winnerId: string; finishReason: string; turnRevision: number; createdAt: number;
  players: { forEach: (callback: (player: NetworkPlayer, key: string) => void) => void };
}

const serverUrl = import.meta.env.VITE_GAME_SERVER_URL ?? "ws://localhost:2567";
const apiUrl = import.meta.env.VITE_GAME_API_URL ?? serverUrl.replace(/^ws/, "http");
const client = new Client(serverUrl);
const TOKEN_KEY = "pixel-dice-duel:reconnection-token";
const ROOM_KEY = "pixel-dice-duel:room-code";

function toBoard(columns: Iterable<NetworkColumn>): Board {
  const board = [...columns].map((column) => [...column.dice] as DieValue[]);
  return [board[0] ?? [], board[1] ?? [], board[2] ?? []];
}

export function toSnapshot(state: NetworkState): OnlineGameSnapshot {
  const players: PlayerSnapshot[] = [];
  state.players.forEach((player) => players.push({
    id: player.id,
    nickname: player.nickname,
    connected: player.connected,
    score: player.score,
    rematch: player.rematch,
    board: toBoard(player.columns),
  }));
  return {
    roomCode: state.roomCode,
    status: state.status as GameStatus,
    players,
    currentTurnPlayerId: state.currentTurnPlayerId,
    currentDie: state.currentDie as DieValue,
    winnerId: state.winnerId,
    finishReason: state.finishReason as OnlineGameSnapshot["finishReason"],
    turnRevision: state.turnRevision,
    createdAt: state.createdAt,
  };
}

class NetworkService {
  room?: Room<NetworkState>;
  private reconnecting?: Promise<Room<NetworkState> | undefined>;

  private remember(room: Room<NetworkState>, roomCode?: string): void {
    this.room = room;
    sessionStorage.setItem(TOKEN_KEY, room.reconnectionToken);
    if (roomCode) sessionStorage.setItem(ROOM_KEY, roomCode);
    room.onStateChange((state) => {
      if (state.roomCode) sessionStorage.setItem(ROOM_KEY, state.roomCode);
    });
    room.onLeave(() => {
      if (this.room === room) this.room = undefined;
    });
  }

  async create(nickname: string): Promise<Room<NetworkState>> {
    const room = await client.create<NetworkState>("dice_duel", { nickname });
    this.remember(room, room.state.roomCode);
    return room;
  }

  async join(roomCode: string, nickname: string): Promise<Room<NetworkState>> {
    const response = await fetch(`${apiUrl}/api/rooms/${encodeURIComponent(roomCode)}`);
    const body = await response.json() as { roomId?: string; error?: string };
    if (!response.ok || !body.roomId) throw new Error(body.error ?? "Não conseguimos encontrar essa sala.");
    const room = await client.joinById<NetworkState>(body.roomId, { nickname });
    this.remember(room, roomCode);
    return room;
  }

  async reconnect(): Promise<Room<NetworkState> | undefined> {
    if (this.room) return this.room;
    if (this.reconnecting) return this.reconnecting;
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;
    this.reconnecting = client.reconnect<NetworkState>(token).then((room) => {
      this.remember(room, sessionStorage.getItem(ROOM_KEY) ?? undefined);
      return room;
    }).finally(() => { this.reconnecting = undefined; });
    return this.reconnecting;
  }

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROOM_KEY);
    this.room = undefined;
  }
}

export const network = new NetworkService();
