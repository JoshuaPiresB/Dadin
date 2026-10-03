import { useEffect, useRef, useState } from "react";
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
  const latestSnapshotRef = useRef(snapshot);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() => (
    window.innerHeight >= window.innerWidth ? "portrait" : "landscape"
  ));

  latestSnapshotRef.current = snapshot;

  useEffect(() => bridgeRef.current.on("column", onColumn), [onColumn]);

  useEffect(() => {
    let resizeFrame = 0;
    const updateOrientation = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const width = viewport?.width ?? window.innerWidth;
        const height = viewport?.height ?? window.innerHeight;
        setOrientation(height >= width ? "portrait" : "landscape");
      });
    };

    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    window.visualViewport?.addEventListener("resize", updateOrientation);
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
      window.visualViewport?.removeEventListener("resize", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    const bridge = bridgeRef.current;
    const portrait = orientation === "portrait";
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: portrait ? 540 : 960,
      height: portrait ? 960 : 720,
      backgroundColor: "#160f24",
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, GameScene],
      callbacks: {
        preBoot: (game) => {
          game.registry.set("bridge", bridge);
          game.registry.set("initialSnapshot", latestSnapshotRef.current);
        },
      },
    });
    return () => {
      bridge.clear("snapshot");
      gameRef.current?.destroy(true);
      gameRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const portrait = orientation === "portrait";
    const width = portrait ? 540 : 960;
    const height = portrait ? 960 : 720;
    if (game.scale.width === width && game.scale.height === height) return;

    game.scale.setGameSize(width, height);
    window.requestAnimationFrame(() => bridgeRef.current.emit("snapshot", latestSnapshotRef.current));
  }, [orientation]);

  useEffect(() => { bridgeRef.current.emit("snapshot", snapshot); }, [snapshot]);
  return <div ref={hostRef} className="phaser-host" data-orientation={orientation} aria-label="Tabuleiro da partida" />;
}
