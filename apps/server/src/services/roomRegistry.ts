import { randomInt } from "node:crypto";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@pixel-dice-duel/shared";

export interface RoomRegistryEntry {
  roomId: string;
  wager: number;
}

const codeToRoom = new Map<string, RoomRegistryEntry>();

export function createRoomCode(roomId: string, wager: number): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
      code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
    }
    if (!codeToRoom.has(code)) {
      codeToRoom.set(code, { roomId, wager });
      return code;
    }
  }
  throw new Error("Não foi possível gerar um código de sala.");
}

export function findRoomId(code: string): string | undefined {
  return codeToRoom.get(code)?.roomId;
}

export function findRoomInfo(code: string): RoomRegistryEntry | undefined {
  return codeToRoom.get(code);
}

export function releaseRoomCode(code: string): void {
  codeToRoom.delete(code);
}
