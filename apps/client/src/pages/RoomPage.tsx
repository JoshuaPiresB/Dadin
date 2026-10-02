import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CLIENT_MESSAGES, SERVER_MESSAGES, type ColumnIndex, type OnlineGameSnapshot } from "@pixel-dice-duel/shared";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { MatchScreen } from "../components/MatchScreen";
import { network, toSnapshot } from "../services/network";
import type { GameViewSnapshot } from "../types/game";
import { loadSettings } from "../store/settings";

type ConnectionStatus = "Conectado" | "Reconectando..." | "Desconectado";

export function RoomPage() {
  const { roomCode = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<OnlineGameSnapshot>();
  const [connection, setConnection] = useState<ConnectionStatus>(network.room ? "Conectado" : "Reconectando...");
  const [error, setError] = useState("");
  const [rolling, setRolling] = useState(true);
  const [locked, setLocked] = useState(true);
  const [notice, setNotice] = useState("");
  const rollingTimer = useRef<number | undefined>(undefined);
  const lastRevision = useRef(-1);

  useEffect(() => {
    let active = true;
    let cleanups: Array<() => void> = [];
    const attach = async () => {
      try {
        const room = network.room ?? await network.reconnect();
        if (!active) return;
        if (!room) {
          setError("Esta sessão não está mais disponível. Entre novamente com o código da sala.");
          setConnection("Desconectado");
          return;
        }
        setConnection("Conectado");
        const update = (raw: typeof room.state) => {
          if (!active) return;
          const next = toSnapshot(raw);
          setState(next);
          setLocked(false);
          if (next.turnRevision !== lastRevision.current && next.status === "PLAYING") {
            lastRevision.current = next.turnRevision;
            setRolling(true); setLocked(true);
            window.clearTimeout(rollingTimer.current);
            rollingTimer.current = window.setTimeout(() => { setRolling(false); setLocked(false); }, loadSettings().reduceMotion ? 120 : 600);
          }
        };
        room.onStateChange(update);
        const offReject = room.onMessage(SERVER_MESSAGES.MOVE_REJECTED, (payload: { reason?: string }) => {
          setLocked(false); setNotice(payload.reason ?? "A jogada foi rejeitada.");
        });
        const offNotice = room.onMessage(SERVER_MESSAGES.REMATCH_DECLINED, (payload: { nickname?: string }) => setNotice(`${payload.nickname ?? "O rival"} recusou a revanche.`));
        const leaveHandler = () => { setConnection("Desconectado"); setLocked(true); };
        room.onLeave(leaveHandler);
        cleanups = [
          () => room.onStateChange.remove(update),
          () => room.onLeave.remove(leaveHandler),
          offReject,
          offNotice,
        ];
        const initialState = room.state as typeof room.state | undefined;
        if (initialState?.players) update(initialState);
      } catch {
        if (!active) return;
        setConnection("Desconectado");
        setError("Não foi possível reconectar à sala. O prazo pode ter expirado.");
        network.clear();
      }
    };
    void attach();
    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
      window.clearTimeout(rollingTimer.current);
    };
  }, []);

  const room = network.room;
  const ownId = room?.sessionId ?? "";
  const me = state?.players.find((player) => player.id === ownId);
  const opponent = state?.players.find((player) => player.id !== ownId);

  const snapshot = useMemo<GameViewSnapshot | undefined>(() => {
    if (!state || !me || !opponent) return undefined;
    return {
      me,
      opponent,
      currentTurnPlayerId: state.currentTurnPlayerId,
      currentDie: state.currentDie,
      status: state.status,
      winnerId: state.winnerId,
      finishReason: state.finishReason,
      turnRevision: state.turnRevision,
      isRolling: rolling,
      inputLocked: locked || connection !== "Conectado",
    };
  }, [state, me, opponent, rolling, locked, connection]);

  const chooseColumn = useCallback((column: ColumnIndex) => {
    if (!network.room || locked) return;
    setLocked(true); setNotice("");
    network.room.send(CLIENT_MESSAGES.PLACE_DIE, { column });
  }, [locked]);

  const leave = useCallback(() => {
    if (state?.status === "PLAYING" && !window.confirm("Tem certeza que deseja abandonar a partida?")) return;
    network.room?.send(CLIENT_MESSAGES.LEAVE_MATCH);
    network.clear();
    navigate("/");
  }, [state?.status, navigate]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setNotice(`${label} copiado.`);
  };

  if (error) return <PageShell title="Sala indisponível"><div className="join-card"><p className="error-banner">{error}</p><PixelButton onClick={() => navigate(`/join/${roomCode}`)}>Entrar novamente</PixelButton><PixelButton variant="ghost" onClick={() => navigate("/")}>Voltar</PixelButton></div></PageShell>;
  if (!state || !me) return <PageShell title="Conectando à mesa"><div className="loading-panel"><div className="loading-die">⚄</div><p>{connection}</p><div className="progress"><i /></div></div></PageShell>;

  if (state.status === "WAITING" || !opponent) {
    const inviteUrl = `${window.location.origin}/join/${state.roomCode}`;
    return <PageShell title="Sala privada"><div className="lobby-panel">
      <p className="eyebrow">Mesa de {me.nickname}</p><h2>Aguardando adversário...</h2>
      <div className="versus-placeholder"><span>{me.nickname}</span><b>VS</b><span className="muted">?</span></div>
      <p>Código da sala</p><strong className="room-code">{state.roomCode}</strong>
      <div className="lobby-buttons"><PixelButton onClick={() => void copy(state.roomCode, "Código")}>Copiar código</PixelButton><PixelButton variant="wine" onClick={() => void copy(inviteUrl, "Link")}>Copiar link</PixelButton></div>
      {notice && <p className="notice">{notice}</p>}
      <PixelButton variant="ghost" onClick={leave}>Fechar sala</PixelButton>
    </div></PageShell>;
  }

  if (!snapshot) return null;
  const rivalDisconnected = !snapshot.opponent.connected;
  const statusLabel = rivalDisconnected ? "Adversário desconectado · aguardando reconexão" : connection;
  const requestRematch = () => network.room?.send(CLIENT_MESSAGES.REQUEST_REMATCH);
  const declineRematch = () => network.room?.send(CLIENT_MESSAGES.DECLINE_REMATCH);
  return <PageShell compact title={`Sala ${state.roomCode}`}>
    {notice && <button className="notice floating" onClick={() => setNotice("")}>{notice}</button>}
    <MatchScreen
      snapshot={snapshot}
      onColumn={chooseColumn}
      onReplay={requestRematch}
      replayLabel={me.rematch ? "Revanche solicitada" : "Pedir revanche"}
      secondaryAction={state.status === "REMATCH_WAITING" && opponent.rematch && !me.rematch ? requestRematch : state.status === "REMATCH_WAITING" ? declineRematch : undefined}
      secondaryLabel={state.status === "REMATCH_WAITING" && opponent.rematch && !me.rematch ? "Aceitar revanche" : "Recusar revanche"}
      onMenu={leave}
      statusLabel={statusLabel}
    />
  </PageShell>;
}
