import { ArraySchema, MapSchema, Schema, defineTypes } from "@colyseus/schema";
import { createEmptyBoard, type Board, type DieValue } from "@pixel-dice-duel/shared";

export class ColumnSchema extends Schema {
  dice = new ArraySchema<number>();
}
defineTypes(ColumnSchema, { dice: ["number"] });

export class PlayerSchema extends Schema {
  id = "";
  nickname = "";
  connected = true;
  score = 0;
  rematch = false;
  coins = 0;
  columns = new ArraySchema<ColumnSchema>(new ColumnSchema(), new ColumnSchema(), new ColumnSchema());
}
defineTypes(PlayerSchema, {
  id: "string",
  nickname: "string",
  connected: "boolean",
  score: "number",
  rematch: "boolean",
  coins: "number",
  columns: [ColumnSchema],
});

export class DiceRoomState extends Schema {
  roomCode = "";
  status = "WAITING";
  players = new MapSchema<PlayerSchema>();
  currentTurnPlayerId = "";
  currentDie: number = 1;
  winnerId = "";
  finishReason = "";
  turnRevision = 0;
  createdAt = Date.now();
  hostPlayerId = "";
  wager = 0;
  pot = 0;
  proposedWager = -1;
  wagerProposalBy = "";
  round = 0;
}
defineTypes(DiceRoomState, {
  roomCode: "string",
  status: "string",
  players: { map: PlayerSchema },
  currentTurnPlayerId: "string",
  currentDie: "number",
  winnerId: "string",
  finishReason: "string",
  turnRevision: "number",
  createdAt: "number",
  hostPlayerId: "string",
  wager: "number",
  pot: "number",
  proposedWager: "number",
  wagerProposalBy: "string",
  round: "number",
});

export function schemaToBoard(player: PlayerSchema): Board {
  return player.columns.map((column) => [...column.dice] as DieValue[]) as Board;
}

export function writeBoard(player: PlayerSchema, board: Board): void {
  board.forEach((column, index) => {
    const target = player.columns[index]!;
    target.dice.splice(0, target.dice.length);
    target.dice.push(...column);
  });
}

export function resetPlayer(player: PlayerSchema): void {
  writeBoard(player, createEmptyBoard());
  player.score = 0;
  player.rematch = false;
  player.connected = true;
}
