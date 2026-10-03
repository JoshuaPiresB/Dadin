import { MAX_COINS, MAX_WAGER } from "@pixel-dice-duel/shared";

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

export function validateCoinBalance(input: unknown): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0 || input > MAX_COINS) {
    throw new Error("Saldo de moedas inválido.");
  }
  return input;
}

export function validateWager(input: unknown): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0 || input > MAX_WAGER) {
    throw new Error(`A aposta deve ser um número inteiro entre 0 e ${MAX_WAGER}.`);
  }
  return input;
}
