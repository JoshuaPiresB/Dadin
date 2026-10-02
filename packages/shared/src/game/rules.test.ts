import { describe, expect, it } from "vitest";
import type { Board, DieValue } from "../types/index.js";
import {
  applyMove,
  calculateBoardScore,
  calculateColumnScore,
  createEmptyBoard,
  determineWinner,
  isGameFinished,
  removeMatchingOpponentDice,
} from "./rules.js";

describe("pontuação", () => {
  it.each([
    [[4], 4], [[4, 4], 16], [[4, 4, 4], 36], [[4, 1, 4], 17], [[6, 6], 24], [[6, 6, 6], 54],
  ] as Array<[DieValue[], number]>)("calcula %j = %i", (column, score) => {
    expect(calculateColumnScore(column)).toBe(score);
  });

  it("soma as três colunas", () => {
    expect(calculateBoardScore([[4, 4], [2], [1, 1, 1]])).toBe(27);
  });
});

describe("destruição e validação", () => {
  it("remove todos os valores iguais apenas da coluna correspondente", () => {
    const board: Board = [[6, 3, 6], [6], []];
    expect(removeMatchingOpponentDice(board, 0, 6).board).toEqual([[3], [6], []]);
  });

  it("aplica a jogada e recalcula ambos os placares", () => {
    const result = applyMove([[2], [], []], [[2, 5], [], []], 2, 0);
    expect(result.ownBoard[0]).toEqual([2, 2]);
    expect(result.opponentBoard[0]).toEqual([5]);
    expect(result.ownScore).toBe(8);
    expect(result.opponentScore).toBe(5);
  });

  it("recusa coluna cheia e índices fora do tabuleiro", () => {
    expect(() => applyMove([[1, 2, 3], [], []], createEmptyBoard(), 4, 0)).toThrow("cheia");
    expect(() => applyMove(createEmptyBoard(), createEmptyBoard(), 4, -1 as never)).toThrow("inválida");
    expect(() => applyMove(createEmptyBoard(), createEmptyBoard(), 4, 3 as never)).toThrow("inválida");
  });
});

describe("fim da partida", () => {
  it("termina quando o nono dado é colocado", () => {
    const board: Board = [[1, 2, 3], [4, 5, 6], [1, 2]];
    const result = applyMove(board, createEmptyBoard(), 3, 2);
    expect(isGameFinished(result.ownBoard)).toBe(true);
    expect(determineWinner(result.ownScore, result.opponentScore)).toBe("PLAYER_ONE");
    expect(determineWinner(20, 20)).toBe("DRAW");
  });
});

