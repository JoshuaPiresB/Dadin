import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { ColumnIndex } from "@pixel-dice-duel/shared";
import type { GameViewSnapshot } from "../types/game";
import { GameBridge } from "./GameBridge";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export function PhaserGame({ snapshot, onColumn }: { snapshot: GameViewSnapshot; onColumn: (column: ColumnIndex) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | undefined>(undefined);
  const bridgeRef = useRef(new GameBridge());

  useEffect(() => bridgeRef.current.on("column", onColumn), [onColumn]);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    const bridge = bridgeRef.current;
    const narrow = window.innerWidth < 700;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: narrow ? 540 : 960,
      height: narrow ? 960 : 720,
      backgroundColor: "#160f24",
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, GameScene],
      callbacks: { preBoot: (game) => game.registry.set("bridge", bridge) },
    });
    gameRef.current.events.on(Phaser.Core.Events.READY, () => {
      window.setTimeout(() => bridge.emit("snapshot", snapshot), 0);
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = undefined;
    };
  }, []);

  useEffect(() => { bridgeRef.current.emit("snapshot", snapshot); }, [snapshot]);
  return <div ref={hostRef} className="phaser-host" aria-label="Tabuleiro da partida" />;
}
