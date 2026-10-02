import { useCallback, useEffect } from "react";
import type { ColumnIndex } from "@pixel-dice-duel/shared";
import type { GameViewSnapshot } from "../types/game";
import { PhaserGame } from "../game/PhaserGame";
import { PixelButton } from "./PixelButton";

interface Props {
  snapshot: GameViewSnapshot;
  onColumn: (column: ColumnIndex) => void;
  onReplay: () => void;
  onMenu: () => void;
  onPause?: () => void;
  paused?: boolean;
  statusLabel?: string;
  replayLabel?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
}

export function MatchScreen({ snapshot, onColumn, onReplay, onMenu, onPause, paused, statusLabel, replayLabel = "Jogar novamente", secondaryAction, secondaryLabel }: Props) {
  const safeColumn = useCallback((column: ColumnIndex) => {
    if (!paused) onColumn(column);
  }, [onColumn, paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPause?.();
      if (["1", "2", "3"].includes(event.key)) safeColumn((Number(event.key) - 1) as ColumnIndex);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safeColumn, onPause]);

  const title = snapshot.winnerId === "DRAW" ? "EMPATE" : snapshot.winnerId === snapshot.me.id ? "VITÓRIA!" : "DERROTA";
  return (
    <div className="match-layout">
      <div className="match-hud match-hud--opponent">
        <span className={`connection-dot ${snapshot.opponent.connected ? "is-online" : ""}`} />
        <strong>{snapshot.opponent.nickname}</strong><b>{snapshot.opponent.score}</b>
      </div>
      <div className="match-hud match-hud--me"><strong>{snapshot.me.nickname}</strong><b>{snapshot.me.score}</b></div>
      {statusLabel && <div className="connection-status">{statusLabel}</div>}
      <PhaserGame snapshot={{ ...snapshot, inputLocked: snapshot.inputLocked || Boolean(paused) }} onColumn={safeColumn} />
      <div className="match-actions">
        {onPause && <PixelButton variant="ghost" onClick={onPause}>{paused ? "Continuar" : "Menu"}</PixelButton>}
        <span>Teclas 1 · 2 · 3 escolhem a coluna</span>
      </div>

      {paused && snapshot.status === "PLAYING" && (
        <div className="modal-backdrop"><div className="result-panel"><h2>PAUSA</h2>
          <PixelButton onClick={onPause}>Continuar</PixelButton>
          <PixelButton variant="danger" onClick={onMenu}>Voltar ao menu</PixelButton>
        </div></div>
      )}

      {snapshot.status !== "PLAYING" && snapshot.status !== "WAITING" && (
        <div className="modal-backdrop"><div className="result-panel">
          <p className="eyebrow">O duelo terminou</p><h2>{title}</h2>
          {snapshot.finishReason && snapshot.finishReason !== "score" && <p className="result-reason">Vitória por abandono</p>}
          <div className="score-line"><span>{snapshot.me.nickname}</span><b>{snapshot.me.score}</b></div>
          <div className="score-line"><span>{snapshot.opponent.nickname}</span><b>{snapshot.opponent.score}</b></div>
          <PixelButton onClick={onReplay}>{replayLabel}</PixelButton>
          {secondaryAction && secondaryLabel && <PixelButton variant="wine" onClick={secondaryAction}>{secondaryLabel}</PixelButton>}
          <PixelButton variant="ghost" onClick={onMenu}>Voltar ao menu</PixelButton>
        </div></div>
      )}
    </div>
  );
}
