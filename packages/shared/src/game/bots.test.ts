import { describe, expect, it } from "vitest";
import type { Board, Difficulty, DieValue } from "../types/index.js";
import { chooseBotMove } from "./bots.js";
import { isColumnFull } from "./rules.js";

describe("bots", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const boards: Board[] = [
    [[], [], []],
    [[1, 2, 3], [4], [5, 5]],
    [[1], [2, 2, 2], [3, 4]],
  ];
  for (const difficulty of difficulties) {
    it(`${difficulty} nunca escolhe uma coluna cheia`, () => {
      for (const board of boards) {
        for (let die = 1; die <= 6; die += 1) {
          const column = chooseBotMove(difficulty, board, [[], [die as DieValue], []], die as DieValue, () => 0.75);
          expect(column).toBeGreaterThanOrEqual(0);
          expect(column).toBeLessThanOrEqual(2);
          expect(isColumnFull(board[column])).toBe(false);
        }
      }
    });
  }
});
