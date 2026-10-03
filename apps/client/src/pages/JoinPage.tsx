import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { loadSettings, saveSettings } from "../store/settings";
import { network, type RoomInfo } from "../services/network";
import { loadWallet } from "../store/wallet";
import { useWallet } from "../hooks/useWallet";

export function JoinPage() {
  const { roomCode = "" } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [nickname, setNickname] = useState(loadSettings().nickname);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo>();

  useEffect(() => {
    let active = true;
    network.getRoomInfo(roomCode.toUpperCase())
      .then((info) => { if (active) setRoomInfo(info); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Sala indisponível."); });
    return () => { active = false; };
  }, [roomCode]);

  const join = async () => {
    setBusy(true); setError("");
    try {
      saveSettings({ ...loadSettings(), nickname: nickname.trim() });
      await network.join(roomCode.toUpperCase(), nickname.trim(), loadWallet().coins);
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível entrar."); setBusy(false); }
  };
  return <PageShell title="Convite para duelo"><div className="join-card">
    <p>Código da mesa</p><strong className="room-code">{roomCode.toUpperCase()}</strong>
    {roomInfo && roomInfo.wager > 0 && <div className="wager-card"><span>Aposta por jogador</span><strong>● {roomInfo.wager}</strong><small>Prêmio total: {roomInfo.wager * 2} moedas</small></div>}
    {roomInfo && roomInfo.wager > wallet.coins && <p className="error-banner">Você precisa de mais {roomInfo.wager - wallet.coins} moedas para entrar.</p>}
    <label className="field"><span>Seu apelido</span><input value={nickname} maxLength={16} onChange={(event) => setNickname(event.target.value)} autoFocus /></label>
    {error && <p className="error-banner">{error}</p>}
    <PixelButton disabled={busy || nickname.trim().length < 2 || Boolean(roomInfo && roomInfo.wager > wallet.coins)} onClick={() => void join()}>{busy ? "Entrando..." : "Aceitar duelo"}</PixelButton>
    <PixelButton variant="ghost" onClick={() => navigate("/")}>Voltar</PixelButton>
  </div></PageShell>;
}
