const NICKNAME_PATTERN = /^[\p{L}\p{N}_ -]+$/u;
const ROOM_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{5}$/;

export function validateNickname(input: unknown): string {
  if (typeof input !== "string") throw new Error("Apelido inválido.");
  const nickname = input.trim().replace(/\s+/g, " ");
  if (nickname.length < 2 || nickname.length > 16 || !NICKNAME_PATTERN.test(nickname)) {
    throw new Error("Use um apelido de 2 a 16 caracteres, sem símbolos especiais.");
  }
  return nickname;
}

export function validateRoomCode(input: unknown): string {
  if (typeof input !== "string") throw new Error("Código inválido.");
  const code = input.trim().toUpperCase();
  if (!ROOM_CODE_PATTERN.test(code)) throw new Error("Código inválido.");
  return code;
}

