export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type ColumnIndex = 0 | 1 | 2;
export type Column = DieValue[];
export type Board = [Column, Column, Column];
export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus = "WAITING" | "PLAYING" | "FINISHED" | "REMATCH_WAITING" | "WAGER_SETUP";
export type GameResult = "PLAYER_ONE" | "PLAYER_TWO" | "DRAW";
export type FinishReason = "score" | "forfeit" | "disconnect";

export interface PlayerSnapshot {
  id: string;
  nickname: string;
  board: Board;
  score: number;
  connected: boolean;
  rematch: boolean;
  coins: number;
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
  hostPlayerId: string;
  wager: number;
  pot: number;
  proposedWager: number;
  wagerProposalBy: string;
  round: number;
}

export type ClientMessage =
  | { type: "place_die"; column: ColumnIndex }
  | { type: "request_rematch" }
  | { type: "decline_rematch" }
  | { type: "propose_wager"; amount: number }
  | { type: "accept_wager" }
  | { type: "decline_wager" }
  | { type: "leave_match" };

export type ServerMessage =
  | { type: "move_rejected"; reason: string }
  | { type: "notice"; message: string }
  | { type: "rematch_declined"; nickname: string }
  | { type: "wager_declined"; nickname: string };
