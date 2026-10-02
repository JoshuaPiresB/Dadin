import type { ColumnIndex } from "@pixel-dice-duel/shared";
import type { GameViewSnapshot } from "../types/game";

type ListenerMap = {
  snapshot: (snapshot: GameViewSnapshot) => void;
  column: (column: ColumnIndex) => void;
};

export class GameBridge {
  private listeners = new Map<keyof ListenerMap, Set<(value: unknown) => void>>();

  on(event: "snapshot", listener: ListenerMap["snapshot"]): () => void;
  on(event: "column", listener: ListenerMap["column"]): () => void;
  on(event: keyof ListenerMap, listener: ListenerMap[keyof ListenerMap]): () => void {
    const set = this.listeners.get(event) ?? new Set<(value: unknown) => void>();
    const wrapped = (value: unknown) => {
      if (event === "snapshot") (listener as ListenerMap["snapshot"])(value as GameViewSnapshot);
      else (listener as ListenerMap["column"])(value as ColumnIndex);
    };
    set.add(wrapped);
    this.listeners.set(event, set);
    return () => { set.delete(wrapped); };
  }

  emit(event: "snapshot", value: GameViewSnapshot): void;
  emit(event: "column", value: ColumnIndex): void;
  emit(event: keyof ListenerMap, value: GameViewSnapshot | ColumnIndex): void {
    const set = this.listeners.get(event);
    set?.forEach((listener) => listener(value));
  }
}
