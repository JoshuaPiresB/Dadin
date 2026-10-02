import type { PropsWithChildren, ReactNode } from "react";
import { GAME_TITLE } from "@pixel-dice-duel/shared";

export function PageShell({ children, title, compact = false }: PropsWithChildren<{ title?: ReactNode; compact?: boolean }>) {
  return (
    <main className={`page-shell ${compact ? "page-shell--compact" : ""}`}>
      <div className="ambient" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}
      </div>
      <section className="game-frame">
        <header className="game-frame__header">
          <div className="rune">✦</div>
          <h1>{title ?? GAME_TITLE}</h1>
          <div className="rune">✦</div>
        </header>
        {children}
      </section>
    </main>
  );
}

