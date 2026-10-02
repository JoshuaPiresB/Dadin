import { useNavigate, useSearchParams } from "react-router-dom";
import type { Difficulty } from "@pixel-dice-duel/shared";
import { PageShell } from "../components/PageShell";
import { MatchScreen } from "../components/MatchScreen";
import { useBotGame } from "../hooks/useBotGame";

export function BotGamePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const raw = params.get("difficulty");
  const difficulty: Difficulty = raw === "medium" || raw === "hard" ? raw : "easy";
  const game = useBotGame(difficulty);
  return <PageShell compact title={`Duelo · ${difficulty === "easy" ? "Fácil" : difficulty === "medium" ? "Médio" : "Difícil"}`}>
    <MatchScreen
      snapshot={game.snapshot}
      onColumn={game.chooseColumn}
      onReplay={game.reset}
      onMenu={() => navigate("/")}
      onPause={() => game.setPaused((value) => !value)}
      paused={game.paused}
    />
  </PageShell>;
}

