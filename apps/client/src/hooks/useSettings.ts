import { useEffect, useState } from "react";
import { loadSettings, saveSettings, type GameSettings } from "../store/settings";

export function useSettings() {
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);
  useEffect(() => {
    const sync = (event: Event) => setSettingsState((event as CustomEvent<GameSettings>).detail);
    window.addEventListener("pixel-settings", sync);
    return () => window.removeEventListener("pixel-settings", sync);
  }, []);
  const setSettings = (next: GameSettings) => {
    saveSettings(next);
    setSettingsState(next);
  };
  return { settings, setSettings };
}

