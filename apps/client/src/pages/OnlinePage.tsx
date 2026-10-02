import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { loadSettings, saveSettings } from "../store/settings";
import { network } from "../services/network";

export function OnlinePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(loadSettings().nickname);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const validNickname = nickname.trim().length >= 2 && nickname.trim().length <= 16;
  const remember = () => saveSettings({ ...loadSettings(), nickname: nickname.trim() });
  const create = async () => {
    if (!validNickname) return setError("Use um apelido de 2 a 16 caracteres.");
    setBusy(true); setError("");
    try {
      remember();
      const room = await network.create(nickname.trim());
      const roomCode = room.state.roomCode || await new Promise<string>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("A sala demorou para responder.")), 4000);
        room.onStateChange.once((nextState) => {
          if (!nextState.roomCode) return;
          window.clearTimeout(timeout);
          resolve(nextState.roomCode);
        });
      });
      navigate(`/room/${roomCode}`);
    } catch { setError("Servidor indisponível. Tente novamente em instantes."); setBusy(false); }
  };
  const join = async () => {
    if (!validNickname) return setError("Use um apelido de 2 a 16 caracteres.");
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length !== 5) return setError("Digite um código de cinco caracteres.");
    setBusy(true); setError("");
    try {
      remember();
      await network.join(roomCode, nickname.trim());
      navigate(`/room/${roomCode}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível entrar na sala."); setBusy(false); }
  };

  return <PageShell title="Salão online"><div className="online-panel">
    <label className="field"><span>Seu apelido</span><input value={nickname} maxLength={16} autoComplete="nickname" onChange={(event) => setNickname(event.target.value)} placeholder="Ex.: Joshua" /></label>
    <div className="online-actions">
      <section><span className="choice-icon">◇</span><h2>Criar sala privada</h2><p>Receba um código e convide um rival.</p><PixelButton disabled={busy} onClick={() => void create()}>{busy ? "Abrindo..." : "Criar sala"}</PixelButton></section>
      <section><span className="choice-icon">⌗</span><h2>Entrar com código</h2><label className="field"><span>Código da sala</span><input value={code} maxLength={5} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="A7K2M" /></label><PixelButton variant="wine" disabled={busy} onClick={() => void join()}>Entrar</PixelButton></section>
    </div>
    {error && <p className="error-banner" role="alert">{error}</p>}
    <PixelButton variant="ghost" onClick={() => navigate("/play")}>Voltar</PixelButton>
  </div></PageShell>;
}
