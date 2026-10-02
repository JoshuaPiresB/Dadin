import { randomInt } from "node:crypto";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@pixel-dice-duel/shared";

const codeToRoom = new Map<string, string>();

export function createRoomCode(roomId: string): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
      code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
    }
    if (!codeToRoom.has(code)) {
      codeToRoom.set(code, roomId);
      return code;
    }
  }
  throw new Error("Não foi possível gerar um código de sala.");
}

export function findRoomId(code: string): string | undefined {
  return codeToRoom.get(code);
}

export function releaseRoomCode(code: string): void {
  codeToRoom.delete(code);
}

