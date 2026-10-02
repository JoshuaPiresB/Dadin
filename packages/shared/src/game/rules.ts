import { BOARD_COLUMNS, COLUMN_CAPACITY } from "../constants/index.js";
import type { Board, Column, ColumnIndex, DieValue, GameResult } from "../types/index.js";

export interface MoveResult {
  ownBoard: Board;
  opponentBoard: Board;
  ownScore: number;
  opponentScore: number;
  removedDice: number;
  destroyedScore: number;
}

export function createEmptyBoard(): Board {
  return [[], [], []];
}

export function cloneBoard(board: Board): Board {
  return board.map((column) => [...column]) as Board;
}

export function cloneGameState<T>(state: T): T {
  return structuredClone(state);
}

export function isColumnIndex(value: number): value is ColumnIndex {
  return Number.isInteger(value) && value >= 0 && value < BOARD_COLUMNS;
}

export function isDieValue(value: number): value is DieValue {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

export function isColumnFull(column: Column): boolean {
  return column.length >= COLUMN_CAPACITY;
}

export function getAvailableColumns(board: Board): ColumnIndex[] {
  return board.flatMap((column, index) =>
    isColumnFull(column) ? [] : [index as ColumnIndex],
  );
}

export function calculateColumnScore(column: Column): number {
  const counts = new Map<DieValue, number>();
  for (const die of column) counts.set(die, (counts.get(die) ?? 0) + 1);
  return [...counts.entries()].reduce((score, [value, count]) => score + value * count * count, 0);
}

export function calculateBoardScore(board: Board): number {
  return board.reduce((score, column) => score + calculateColumnScore(column), 0);
}

export function removeMatchingOpponentDice(
  board: Board,
  columnIndex: ColumnIndex,
  die: DieValue,
): { board: Board; removedDice: number; destroyedScore: number } {
  const next = cloneBoard(board);
  const beforeScore = calculateColumnScore(next[columnIndex]);
  const kept = next[columnIndex].filter((value) => value !== die);
  const removedDice = next[columnIndex].length - kept.length;
  next[columnIndex] = kept;
  return {
    board: next,
    removedDice,
    destroyedScore: beforeScore - calculateColumnScore(kept),
  };
}

export function applyMove(
  ownBoard: Board,
  opponentBoard: Board,
  die: DieValue,
  columnIndex: ColumnIndex,
): MoveResult {
  if (!isColumnIndex(columnIndex)) throw new Error("Coluna inválida.");
  if (!isDieValue(die)) throw new Error("Dado inválido.");
  if (isColumnFull(ownBoard[columnIndex])) throw new Error("Esta coluna está cheia.");

  const nextOwn = cloneBoard(ownBoard);
  nextOwn[columnIndex].push(die);
  const removal = removeMatchingOpponentDice(opponentBoard, columnIndex, die);
  return {
    ownBoard: nextOwn,
    opponentBoard: removal.board,
    ownScore: calculateBoardScore(nextOwn),
    opponentScore: calculateBoardScore(removal.board),
    removedDice: removal.removedDice,
    destroyedScore: removal.destroyedScore,
  };
}

export function isGameFinished(board: Board): boolean {
  return board.every(isColumnFull);
}

export function determineWinner(playerOneScore: number, playerTwoScore: number): GameResult {
  if (playerOneScore === playerTwoScore) return "DRAW";
  return playerOneScore > playerTwoScore ? "PLAYER_ONE" : "PLAYER_TWO";
}

export function countDice(board: Board): number {
  return board.reduce((total, column) => total + column.length, 0);
}

