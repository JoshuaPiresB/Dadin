import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
export function NotFoundPage() { const navigate = useNavigate(); return <PageShell title="Caminho perdido"><div className="join-card"><p>Essa parte da taverna não existe.</p><PixelButton onClick={() => navigate("/")}>Voltar ao menu</PixelButton></div></PageShell>; }

