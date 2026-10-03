import { beforeEach, describe, expect, it, vi } from "vitest";
import { awardBotVictory, loadWallet, setCoinBalance } from "./wallet";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("carteira de moedas", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    vi.stubGlobal("CustomEvent", class {
      constructor(public type: string, public options?: unknown) {}
    });
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  it("começa zerada e persiste o saldo", () => {
    expect(loadWallet().coins).toBe(0);
    setCoinBalance(40);
    expect(loadWallet().coins).toBe(40);
  });

  it("premia vitórias nos três níveis", () => {
    awardBotVictory("easy");
    awardBotVictory("medium");
    awardBotVictory("hard");
    expect(loadWallet().coins).toBe(85);
  });
});
