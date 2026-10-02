import { describe, expect, it } from "vitest";
import { validateNickname, validateRoomCode } from "./validation.js";

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
});

