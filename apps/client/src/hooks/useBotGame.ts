import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOT_COIN_REWARDS,
  applyMove,
  chooseBotMove,
  createEmptyBoard,
  determineWinner,
  isGameFinished,
  type ColumnIndex,
  type DieValue,
  type Difficulty,
} from "@pixel-dice-duel/shared";
import type { GameViewSnapshot, ViewPlayer } from "../types/game";
import { playSound } from "../services/audio";
import { loadSettings } from "../store/settings";
import { awardBotVictory } from "../store/wallet";

function secureDie(): DieValue {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return ((value[0]! % 6) + 1) as DieValue;
}

function secureBoolean(): boolean {
  const value = new Uint8Array(1);
  crypto.getRandomValues(value);
  return value[0]! % 2 === 0;
}

function player(id: string, nickname: string): ViewPlayer {
  return { id, nickname, board: createEmptyBoard(), score: 0, connected: true };
}

function initialSnapshot(): GameViewSnapshot {
  const me = player("human", loadSettings().nickname || "Aventureiro");
  const opponent = player("bot", "Oráculo de Bronze");
  return {
    me, opponent, currentTurnPlayerId: secureBoolean() ? me.id : opponent.id,
    currentDie: secureDie(), status: "PLAYING", winnerId: "", turnRevision: 1,
    isRolling: true, inputLocked: true,
  };
}

export function useBotGame(difficulty: Difficulty) {
  const [snapshot, setSnapshot] = useState<GameViewSnapshot>(initialSnapshot);
  const [paused, setPaused] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);
  const rewardClaimed = useRef(false);

  const startRoll = useCallback(() => {
    playSound("roll");
    setSnapshot((current) => ({ ...current, isRolling: true, inputLocked: true }));
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSnapshot((current) => ({ ...current, isRolling: false, inputLocked: current.currentTurnPlayerId !== current.me.id }));
    }, loadSettings().reduceMotion ? 120 : 560);
  }, []);

  useEffect(() => {
    if (!paused && snapshot.status === "PLAYING" && snapshot.isRolling) startRoll();
    return () => window.clearTimeout(timerRef.current);
  }, [snapshot.turnRevision, paused]);

  const playMove = useCallback((actorId: string, column: ColumnIndex) => {
    setSnapshot((current) => {
      if (paused || current.status !== "PLAYING" || current.isRolling || current.currentTurnPlayerId !== actorId) return current;
      const actorIsHuman = actorId === current.me.id;
      const actor = actorIsHuman ? current.me : current.opponent;
      const rival = actorIsHuman ? current.opponent : current.me;
      try {
        const result = applyMove(actor.board, rival.board, current.currentDie, column);
        playSound(result.removedDice ? "destroy" : "place");
        const nextActor = { ...actor, board: result.ownBoard, score: result.ownScore };
        const nextRival = { ...rival, board: result.opponentBoard, score: result.opponentScore };
        if (isGameFinished(result.ownBoard)) {
          const winner = determineWinner(nextActor.score, nextRival.score);
          const winnerId = winner === "DRAW" ? "DRAW" : winner === "PLAYER_ONE" ? nextActor.id : nextRival.id;
          playSound(winnerId === "human" ? "victory" : winnerId === "DRAW" ? "combo" : "defeat");
          return {
            ...current,
            me: actorIsHuman ? nextActor : nextRival,
            opponent: actorIsHuman ? nextRival : nextActor,
            status: "FINISHED",
            winnerId,
            currentTurnPlayerId: "",
            inputLocked: true,
          };
        }
        return {
          ...current,
          me: actorIsHuman ? nextActor : nextRival,
          opponent: actorIsHuman ? nextRival : nextActor,
          currentTurnPlayerId: rival.id,
          currentDie: secureDie(),
          turnRevision: current.turnRevision + 1,
          isRolling: true,
          inputLocked: true,
        };
      } catch {
        return current;
      }
    });
  }, [paused]);

  useEffect(() => {
    if (paused || snapshot.status !== "PLAYING" || snapshot.isRolling || snapshot.currentTurnPlayerId !== snapshot.opponent.id) return;
    const delay = loadSettings().reduceMotion ? 120 : 420;
    const timer = window.setTimeout(() => {
      const column = chooseBotMove(difficulty, snapshot.opponent.board, snapshot.me.board, snapshot.currentDie);
      playMove(snapshot.opponent.id, column);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [snapshot, difficulty, paused, playMove]);

  useEffect(() => {
    if (snapshot.status !== "FINISHED" || snapshot.winnerId !== snapshot.me.id || rewardClaimed.current) return;
    rewardClaimed.current = true;
    const reward = BOT_COIN_REWARDS[difficulty];
    awardBotVictory(difficulty);
    setEarnedCoins(reward);
  }, [snapshot.status, snapshot.winnerId, snapshot.me.id, difficulty]);

  const reset = useCallback(() => {
    rewardClaimed.current = false;
    setEarnedCoins(0);
    setSnapshot(initialSnapshot());
  }, []);
  const chooseColumn = useCallback((column: ColumnIndex) => playMove("human", column), [playMove]);
  return { snapshot, chooseColumn, reset, paused, setPaused, earnedCoins };
}
