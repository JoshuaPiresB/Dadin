export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type ColumnIndex = 0 | 1 | 2;
export type Column = DieValue[];
export type Board = [Column, Column, Column];
export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus = "WAITING" | "PLAYING" | "FINISHED" | "REMATCH_WAITING";
export type GameResult = "PLAYER_ONE" | "PLAYER_TWO" | "DRAW";
export type FinishReason = "score" | "forfeit" | "disconnect";

export interface PlayerSnapshot {
  id: string;
  nickname: string;
  board: Board;
  score: number;
  connected: boolean;
  rematch: boolean;
}

export interface OnlineGameSnapshot {
  roomCode: string;
  status: GameStatus;
  players: PlayerSnapshot[];
  currentTurnPlayerId: string;
  currentDie: DieValue;
  winnerId: string;
  finishReason: FinishReason | "";
  turnRevision: number;
  createdAt: number;
}

export type ClientMessage =
  | { type: "place_die"; column: ColumnIndex }
  | { type: "request_rematch" }
  | { type: "decline_rematch" }
  | { type: "leave_match" };

export type ServerMessage =
  | { type: "move_rejected"; reason: string }
  | { type: "notice"; message: string }
  | { type: "rematch_declined"; nickname: string };

