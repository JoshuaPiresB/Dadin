import { useNavigate } from "react-router-dom";
import { BOT_COIN_REWARDS, type Difficulty } from "@pixel-dice-duel/shared";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";

const choices: Array<{ id: Difficulty; title: string; copy: string; icon: string }> = [
  { id: "easy", title: "Fácil", copy: "Escolhe uma coluna livre sem planejar.", icon: "Ⅰ" },
  { id: "medium", title: "Médio", copy: "Busca combinações e ataques diretos.", icon: "Ⅱ" },
  { id: "hard", title: "Difícil", copy: "Calcula respostas e valor esperado.", icon: "Ⅲ" },
];

export function BotSelectPage() {
  const navigate = useNavigate();
  return <PageShell title="Oráculos da taverna"><div className="difficulty-grid">
    {choices.map((choice) => <button key={choice.id} className="difficulty-card" onClick={() => navigate(`/play/bot/match?difficulty=${choice.id}`)}>
      <b>{choice.icon}</b><h2>{choice.title}</h2><p>{choice.copy}</p><span className="bot-reward">● Vitória: +{BOT_COIN_REWARDS[choice.id]}</span>
    </button>)}
    <PixelButton className="span-all" variant="ghost" onClick={() => navigate("/play")}>Voltar</PixelButton>
  </div></PageShell>;
}
