import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";

export function HomePage() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="home-scene">
        <div className="sigil" aria-hidden="true"><span>⚄</span></div>
        <p className="eyebrow">A mesa arcana está aberta</p>
        <nav className="menu-stack" aria-label="Menu principal">
          <PixelButton onClick={() => navigate("/play")}>Jogar</PixelButton>
          <PixelButton variant="wine" onClick={() => navigate("/how-to-play")}>Como jogar</PixelButton>
          <PixelButton variant="ghost" onClick={() => navigate("/settings")}>Configurações</PixelButton>
        </nav>
        <p className="home-tip">Combine. Destrua. Domine a mesa.</p>
      </div>
    </PageShell>
  );
}

