import type { Board, DieValue, GameStatus } from "@pixel-dice-duel/shared";

export interface ViewPlayer {
  id: string;
  nickname: string;
  board: Board;
  score: number;
  connected: boolean;
  rematch?: boolean;
}

export interface GameViewSnapshot {
  me: ViewPlayer;
  opponent: ViewPlayer;
  currentTurnPlayerId: string;
  currentDie: DieValue;
  status: GameStatus;
  winnerId: string;
  finishReason?: string;
  turnRevision: number;
  isRolling: boolean;
  inputLocked: boolean;
}

