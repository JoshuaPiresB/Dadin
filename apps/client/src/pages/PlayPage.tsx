import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";

export function PlayPage() {
  const navigate = useNavigate();
  return <PageShell title="Escolha seu duelo"><div className="menu-panel">
    <div className="choice-card"><span className="choice-icon">⚔</span><h2>Contra bot</h2><p>Enfrente os oráculos em três níveis.</p><PixelButton onClick={() => navigate("/play/bot")}>Escolher dificuldade</PixelButton></div>
    <div className="choice-card"><span className="choice-icon">◇</span><h2>Online</h2><p>Crie uma mesa privada ou use um código.</p><PixelButton variant="wine" onClick={() => navigate("/online")}>Abrir salão online</PixelButton></div>
    <PixelButton className="span-all" variant="ghost" onClick={() => navigate("/")}>Voltar</PixelButton>
  </div></PageShell>;
}

