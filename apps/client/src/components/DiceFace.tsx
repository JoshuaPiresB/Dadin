import type { DieValue } from "@pixel-dice-duel/shared";

const pips: Record<DieValue, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

export function DiceFace({ value, small = false }: { value: DieValue; small?: boolean }) {
  return (
    <span className={`dice-face ${small ? "dice-face--small" : ""}`} aria-label={`Dado ${value}`}>
      {Array.from({ length: 9 }, (_, index) => <i key={index} className={pips[value].includes(index) ? "is-on" : ""} />)}
    </span>
  );
}
