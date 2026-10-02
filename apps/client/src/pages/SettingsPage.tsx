import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
  const navigate = useNavigate();
  const { settings, setSettings } = useSettings();
  return <PageShell title="Configurações"><div className="settings-panel">
    <label><span>Volume geral <b>{Math.round(settings.masterVolume * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={settings.masterVolume} onChange={(event) => setSettings({ ...settings, masterVolume: Number(event.target.value) })} /></label>
    <label><span>Volume de efeitos <b>{Math.round(settings.effectsVolume * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={settings.effectsVolume} onChange={(event) => setSettings({ ...settings, effectsVolume: Number(event.target.value) })} /></label>
    <label className="switch-row"><span>Reduzir animações</span><input type="checkbox" checked={settings.reduceMotion} onChange={(event) => setSettings({ ...settings, reduceMotion: event.target.checked })} /></label>
    <PixelButton variant="wine" onClick={() => document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen()}>Alternar tela cheia</PixelButton>
    <PixelButton variant="ghost" onClick={() => navigate(-1)}>Voltar</PixelButton>
  </div></PageShell>;
}

