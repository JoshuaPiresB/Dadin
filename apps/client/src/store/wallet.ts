import { BOT_COIN_REWARDS, MAX_COINS, type Difficulty } from "@pixel-dice-duel/shared";

export interface WalletState {
  coins: number;
}

interface StoredWallet extends WalletState {
  version: 1;
}

const STORAGE_KEY = "dadin:wallet";
const WALLET_EVENT = "dadin-wallet";
const defaultWallet: WalletState = { coins: 0 };

function normalizeCoins(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_COINS, Math.floor(value)));
}

export function loadWallet(): WalletState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<StoredWallet>;
    return { coins: normalizeCoins(stored.coins) };
  } catch {
    return defaultWallet;
  }
}

export function setCoinBalance(coins: number): WalletState {
  const wallet = { coins: normalizeCoins(coins) };
  if (loadWallet().coins === wallet.coins) return wallet;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...wallet } satisfies StoredWallet));
  window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: wallet }));
  return wallet;
}

export function addCoins(amount: number): WalletState {
  return setCoinBalance(loadWallet().coins + Math.max(0, Math.floor(amount)));
}

export function awardBotVictory(difficulty: Difficulty): WalletState {
  return addCoins(BOT_COIN_REWARDS[difficulty]);
}

export const walletStorageKey = STORAGE_KEY;
export const walletEventName = WALLET_EVENT;
