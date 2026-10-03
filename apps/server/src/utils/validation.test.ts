import { describe, expect, it } from "vitest";
import { validateCoinBalance, validateNickname, validateRoomCode, validateWager } from "./validation.js";

describe("validação de entrada do servidor", () => {
  it("aceita apelidos legíveis e normaliza espaços", () => {
    expect(validateNickname("  Ana   Maria ")).toBe("Ana Maria");
  });

  it.each(["<b>cheat</b>", "a", "nome_com_mais_de_16_caracteres"])("recusa apelido inseguro: %s", (nickname) => {
    expect(() => validateNickname(nickname)).toThrow();
  });

  it("aceita apenas códigos curtos sem caracteres ambíguos", () => {
    expect(validateRoomCode("a7k2m")).toBe("A7K2M");
    expect(() => validateRoomCode("O1IL0")).toThrow();
  });

  it("valida saldos e apostas inteiras e não negativas", () => {
    expect(validateCoinBalance(250)).toBe(250);
    expect(validateWager(50)).toBe(50);
    expect(() => validateCoinBalance(-1)).toThrow();
    expect(() => validateWager(1.5)).toThrow();
  });
});
