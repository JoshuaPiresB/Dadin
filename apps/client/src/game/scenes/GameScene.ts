import Phaser from "phaser";
import { calculateColumnScore, isColumnFull, type Board, type ColumnIndex, type DieValue } from "@pixel-dice-duel/shared";
import type { GameViewSnapshot } from "../../types/game";
import type { GameBridge } from "../GameBridge";

const PALETTE = {
  night: 0x160f24,
  wine: 0x5b2037,
  wineCombo: 0x8f3b55,
  wineTriple: 0xb64f66,
  wood: 0x4a2b26,
  woodLight: 0x754231,
  gold: 0xd3a84d,
  goldBright: 0xffe08a,
  cream: 0xffefc1,
  blue: 0x263a5d,
  blueCombo: 0x365b86,
  blueTriple: 0x4f78a8,
  purple: 0x3b244d,
  shadow: 0x0b0812,
};

export class GameScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private snapshot?: GameViewSnapshot;
  private rollEvent?: Phaser.Time.TimerEvent;
  private unsubscribeSnapshot?: () => void;

  constructor() {
    super("GameScene");
  }

  init(data: { bridge: GameBridge }): void {
    this.bridge = data.bridge;
  }

  create(): void {
    this.unsubscribeSnapshot?.();
    this.unsubscribeSnapshot = this.bridge.on("snapshot", (snapshot) => this.updateSnapshot(snapshot));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = undefined;
    });
    const initialSnapshot = this.registry.get("initialSnapshot") as GameViewSnapshot | undefined;
    if (initialSnapshot) this.updateSnapshot(initialSnapshot);
  }

  private updateSnapshot(snapshot: GameViewSnapshot): void {
    this.snapshot = snapshot;
    this.rollEvent?.remove(false);

    if (!snapshot.isRolling) {
      this.draw(snapshot, snapshot.currentDie);
      return;
    }

    let ticks = 0;
    this.rollEvent = this.time.addEvent({
      delay: 75,
      repeat: 6,
      callback: () => {
        ticks += 1;
        const display = (1 + ((snapshot.currentDie + ticks * 3) % 6)) as DieValue;
        this.draw(snapshot, ticks >= 7 ? snapshot.currentDie : display);
      },
    });
  }

  private draw(snapshot: GameViewSnapshot, displayDie: DieValue): void {
    this.children.removeAll(true);

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const narrow = width < 700;
    const opponentY = narrow ? 205 : 140;
    const playerY = narrow ? height - 205 : height - 140;
    const opponentTableY = narrow ? 390 : 310;
    const playerTableY = narrow ? height - 390 : height - 310;

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.night).fillRect(0, 0, width, height);
    for (let x = 0; x < width; x += 24) {
      bg.fillStyle((x / 24) % 2 ? PALETTE.wood : PALETTE.woodLight, 0.22).fillRect(x, 0, 22, height);
    }
    bg.fillStyle(PALETTE.purple, 0.5).fillRect(0, height / 2 - 62, width, 124);
    bg.fillStyle(PALETTE.gold, 0.35).fillRect(0, height / 2 - 1, width, 2);

    this.drawBoard(snapshot.opponent.board, centerX, opponentY, false, false);
    this.drawBoard(
      snapshot.me.board,
      centerX,
      playerY,
      true,
      !snapshot.inputLocked
        && snapshot.currentTurnPlayerId === snapshot.me.id
        && snapshot.status === "PLAYING",
    );
    this.drawRollTables(displayDie, snapshot, opponentTableY, playerTableY);
  }

  private drawBoard(
    board: Board,
    centerX: number,
    centerY: number,
    mine: boolean,
    interactive: boolean,
  ): void {
    const labelY = mine ? centerY - 112 : centerY + 112;

    board.forEach((column, columnIndex) => {
      const x = centerX + (columnIndex - 1) * 96;
      const score = calculateColumnScore(column);
      const counts = new Map<DieValue, number>();
      const boxes: Phaser.GameObjects.Rectangle[] = [];
      column.forEach((die) => counts.set(die, (counts.get(die) ?? 0) + 1));

      const scoreText = this.add.text(x, labelY, `${score}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: score > 0 ? "#ffe08a" : "#ffefc1",
        fontStyle: "bold",
        backgroundColor: "#160f24",
        padding: { x: 9, y: 4 },
      }).setOrigin(0.5);
      scoreText.setStroke("#4a2b26", 2);
      scoreText.setShadow(2, 2, "#0b0812", 0, true, true);

      for (let slot = 0; slot < 3; slot += 1) {
        const y = centerY + (slot - 1) * 64;
        const box = this.add.rectangle(x, y, 58, 58, PALETTE.shadow, 0.58)
          .setStrokeStyle(
            3,
            isColumnFull(column) ? 0x5f5268 : PALETTE.gold,
            isColumnFull(column) ? 0.45 : 0.85,
          );
        boxes.push(box);
      }

      column.forEach((die, slot) => {
        const y = centerY + (slot - 1) * 64;
        this.drawDie(
          x,
          y,
          die,
          mine ? PALETTE.wine : PALETTE.blue,
          48,
          counts.get(die) ?? 1,
          mine,
        );
      });

      if (mine && interactive && !isColumnFull(column)) {
        this.add.rectangle(x, centerY, 96, 198, 0xffffff, 0.001)
          .setDepth(20)
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => boxes.forEach((box) => box.setFillStyle(PALETTE.wine, 0.8)))
          .on("pointerout", () => boxes.forEach((box) => box.setFillStyle(PALETTE.shadow, 0.58)))
          .on("pointerup", () => this.bridge.emit("column", columnIndex as ColumnIndex));
      }
    });
  }

  private drawRollTables(
    value: DieValue,
    snapshot: GameViewSnapshot,
    opponentY: number,
    playerY: number,
  ): void {
    const activeMine = snapshot.currentTurnPlayerId === snapshot.me.id;
    const turnLabel = snapshot.status === "PLAYING"
      ? snapshot.isRolling
        ? "ROLANDO..."
        : activeMine
          ? "SEU TURNO"
          : `TURNO DE ${snapshot.opponent.nickname.toUpperCase()}`
      : snapshot.status === "WAITING"
        ? "AGUARDANDO RIVAL"
        : "PARTIDA ENCERRADA";

    this.drawRollTable(
      this.scale.width / 2,
      opponentY,
      false,
      !activeMine && snapshot.status === "PLAYING",
      !activeMine && snapshot.status === "PLAYING" ? value : undefined,
      snapshot.isRolling && !activeMine,
    );
    this.drawRollTable(
      this.scale.width / 2,
      playerY,
      true,
      activeMine && snapshot.status === "PLAYING",
      activeMine && snapshot.status === "PLAYING" ? value : undefined,
      snapshot.isRolling && activeMine,
    );

    const label = this.add.text(this.scale.width / 2, this.scale.height / 2, turnLabel, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: activeMine ? "#ffe08a" : "#d7c8e7",
      fontStyle: "bold",
      backgroundColor: "#160f24",
      padding: { x: 12, y: 5 },
    }).setOrigin(0.5);
    label.setStroke("#4a2b26", 3);
  }

  private drawRollTable(
    x: number,
    y: number,
    mine: boolean,
    active: boolean,
    value?: DieValue,
    rolling = false,
  ): void {
    const width = Math.min(286, this.scale.width - 110);
    const table = this.add.rectangle(
      x,
      y,
      width,
      70,
      active ? PALETTE.woodLight : PALETTE.wood,
      active ? 0.98 : 0.68,
    ).setStrokeStyle(4, active ? PALETTE.goldBright : PALETTE.gold, active ? 0.95 : 0.45);
    this.add.rectangle(x, y + 31, width - 12, 8, PALETTE.shadow, 0.65);
    this.add.rectangle(x - width / 2 + 22, y + 45, 15, 30, PALETTE.wood, 0.9);
    this.add.rectangle(x + width / 2 - 22, y + 45, 15, 30, PALETTE.wood, 0.9);

    const owner = this.add.text(x - width / 2 + 18, y, mine ? "SUA MESA" : "MESA RIVAL", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: active ? "#ffe08a" : "#d7c8e7",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    if (!active || value === undefined) {
      this.add.rectangle(x + width / 2 - 55, y, 46, 46, PALETTE.shadow, 0.35)
        .setStrokeStyle(2, PALETTE.cream, 0.2);
      table.setDepth(1);
      owner.setDepth(2);
      return;
    }

    const dieX = x + width / 2 - 55;
    const die = this.drawDie(dieX, y, value, mine ? PALETTE.wine : PALETTE.blue, 50);
    if (rolling) {
      die.setAngle(-8);
      this.tweens.add({
        targets: die,
        angle: 10,
        y: y - 7,
        duration: 72,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  private drawDie(
    x: number,
    y: number,
    value: DieValue,
    baseColor: number,
    size: number,
    multiplier = 1,
    mine = false,
  ): Phaser.GameObjects.Container {
    const enhanced = multiplier > 1;
    const faceColor = multiplier >= 3
      ? mine ? PALETTE.wineTriple : PALETTE.blueTriple
      : multiplier === 2
        ? mine ? PALETTE.wineCombo : PALETTE.blueCombo
        : baseColor;
    const borderColor = enhanced ? PALETTE.goldBright : PALETTE.cream;
    const pieces: Phaser.GameObjects.GameObject[] = [];

    if (enhanced) {
      pieces.push(
        this.add.rectangle(0, 0, size + 10, size + 10, PALETTE.gold, 0.18)
          .setStrokeStyle(2, PALETTE.goldBright, 0.7),
      );
    }

    pieces.push(this.add.rectangle(4, 5, size, size, PALETTE.shadow, 0.78));
    pieces.push(this.add.rectangle(0, 0, size, size, faceColor).setStrokeStyle(4, borderColor));

    const positions: ReadonlyArray<readonly [number, number]> = [
      [-0.25, -0.25],
      [0, -0.25],
      [0.25, -0.25],
      [-0.25, 0],
      [0, 0],
      [0.25, 0],
      [-0.25, 0.25],
      [0, 0.25],
      [0.25, 0.25],
    ];
    const pipMap: Record<DieValue, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    pipMap[value].forEach((index) => {
      const position = positions[index]!;
      pieces.push(
        this.add.rectangle(
          position[0] * size,
          position[1] * size,
          Math.max(5, size / 9),
          Math.max(5, size / 9),
          PALETTE.cream,
        ),
      );
    });

    if (enhanced) {
      const cornerSize = Math.max(5, size / 8);
      [
        [-size / 2 + 3, -size / 2 + 3],
        [size / 2 - 3, -size / 2 + 3],
        [-size / 2 + 3, size / 2 - 3],
        [size / 2 - 3, size / 2 - 3],
      ].forEach(([cornerX, cornerY]) => {
        pieces.push(this.add.rectangle(cornerX, cornerY, cornerSize, cornerSize, PALETTE.goldBright));
      });
      pieces.push(
        this.add.text(size / 2 - 2, -size / 2 + 2, `×${multiplier}`, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#160f24",
          backgroundColor: "#ffe08a",
          fontStyle: "bold",
          padding: { x: 3, y: 1 },
        }).setOrigin(1, 0),
      );
    }

    return this.add.container(x, y, pieces);
  }
}
