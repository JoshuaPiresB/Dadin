export interface GameSettings {
  masterVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  nickname: string;
}

export const defaultSettings: GameSettings = {
  masterVolume: 0.7,
  effectsVolume: 0.8,
  reduceMotion: false,
  nickname: "",
};

const STORAGE_KEY = "pixel-dice-duel:settings";

export function loadSettings(): GameSettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") } as GameSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("pixel-settings", { detail: settings }));
}

