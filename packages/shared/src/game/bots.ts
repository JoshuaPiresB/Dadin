import type { Board, ColumnIndex, DieValue, Difficulty } from "../types/index.js";
import {
  applyMove,
  calculateBoardScore,
  getAvailableColumns,
  isGameFinished,
} from "./rules.js";

function comboWeight(board: Board): number {
  return board.reduce((total, column) => {
    const groups = new Map<number, number>();
    column.forEach((die) => groups.set(die, (groups.get(die) ?? 0) + 1));
    return total + [...groups.values()].reduce((sum, count) => sum + (count === 3 ? 16 : count === 2 ? 6 : 0), 0);
  }, 0);
}

function vulnerability(board: Board): number {
  return board.reduce((risk, column) => {
    const groups = new Map<number, number>();
    column.forEach((die) => groups.set(die, (groups.get(die) ?? 0) + 1));
    return risk + [...groups.entries()].reduce((sum, [value, count]) => sum + (count > 1 ? value * count : 0), 0);
  }, 0);
}

export function evaluateMove(ownBoard: Board, opponentBoard: Board, die: DieValue, column: ColumnIndex): number {
  const beforeOwn = calculateBoardScore(ownBoard);
  const beforeOpponent = calculateBoardScore(opponentBoard);
  const result = applyMove(ownBoard, opponentBoard, die, column);
  const ownGain = result.ownScore - beforeOwn;
  const destroyed = beforeOpponent - result.opponentScore;
  const finishBonus = isGameFinished(result.ownBoard) ? (result.ownScore - result.opponentScore) * 6 : 0;
  return ownGain + destroyed * 1.35 + comboWeight(result.ownBoard) + finishBonus - vulnerability(result.ownBoard) * 0.12;
}

function mediumMove(ownBoard: Board, opponentBoard: Board, die: DieValue): ColumnIndex {
  const available = getAvailableColumns(ownBoard);
  return available.reduce((best, column) =>
    evaluateMove(ownBoard, opponentBoard, die, column) > evaluateMove(ownBoard, opponentBoard, die, best)
      ? column
      : best,
  );
}

function positionValue(ownBoard: Board, opponentBoard: Board): number {
  return calculateBoardScore(ownBoard) - calculateBoardScore(opponentBoard) + comboWeight(ownBoard) * 0.55 - vulnerability(ownBoard) * 0.15;
}

function expectedOpponentReply(ownBoard: Board, opponentBoard: Board): number {
  let total = 0;
  for (let rawDie = 1; rawDie <= 6; rawDie += 1) {
    const die = rawDie as DieValue;
    const replies = getAvailableColumns(opponentBoard);
    if (replies.length === 0) {
      total += positionValue(ownBoard, opponentBoard);
      continue;
    }
    const worstForUs = Math.min(...replies.map((column) => {
      const reply = applyMove(opponentBoard, ownBoard, die, column);
      return positionValue(reply.opponentBoard, reply.ownBoard);
    }));
    total += worstForUs;
  }
  return total / 6;
}

function hardMove(ownBoard: Board, opponentBoard: Board, die: DieValue): ColumnIndex {
  const available = getAvailableColumns(ownBoard);
  let best = available[0]!;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const column of available) {
    const result = applyMove(ownBoard, opponentBoard, die, column);
    const immediate = evaluateMove(ownBoard, opponentBoard, die, column);
    const expected = expectedOpponentReply(result.ownBoard, result.opponentBoard);
    const value = immediate * 0.6 + expected * 0.9;
    if (value > bestValue) {
      bestValue = value;
      best = column;
    }
  }
  return best;
}

export function chooseBotMove(
  difficulty: Difficulty,
  ownBoard: Board,
  opponentBoard: Board,
  die: DieValue,
  random: () => number = Math.random,
): ColumnIndex {
  const available = getAvailableColumns(ownBoard);
  if (available.length === 0) throw new Error("O bot não possui jogadas válidas.");
  if (difficulty === "easy") return available[Math.floor(random() * available.length)]!;
  if (difficulty === "medium") return mediumMove(ownBoard, opponentBoard, die);
  return hardMove(ownBoard, opponentBoard, die);
}

