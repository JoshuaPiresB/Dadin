import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { loadSettings, saveSettings } from "../store/settings";
import { network } from "../services/network";

export function JoinPage() {
  const { roomCode = "" } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(loadSettings().nickname);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true); setError("");
    try {
      saveSettings({ ...loadSettings(), nickname: nickname.trim() });
      await network.join(roomCode.toUpperCase(), nickname.trim());
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível entrar."); setBusy(false); }
  };
  return <PageShell title="Convite para duelo"><div className="join-card">
    <p>Código da mesa</p><strong className="room-code">{roomCode.toUpperCase()}</strong>
    <label className="field"><span>Seu apelido</span><input value={nickname} maxLength={16} onChange={(event) => setNickname(event.target.value)} autoFocus /></label>
    {error && <p className="error-banner">{error}</p>}
    <PixelButton disabled={busy || nickname.trim().length < 2} onClick={() => void join()}>{busy ? "Entrando..." : "Aceitar duelo"}</PixelButton>
    <PixelButton variant="ghost" onClick={() => navigate("/")}>Voltar</PixelButton>
  </div></PageShell>;
}

