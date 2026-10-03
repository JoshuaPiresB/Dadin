import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PixelButton } from "../components/PixelButton";
import { DiceFace } from "../components/DiceFace";

export function HowToPlayPage() {
  const navigate = useNavigate();
  return <PageShell title="Como jogar"><div className="rules-page">
    <div className="rule-step"><b>1</b><div><h2>Receba o dado</h2><p>A cada turno, um dado de 1 a 6 é revelado.</p></div></div>
    <div className="rule-step"><b>2</b><div><h2>Escolha uma coluna</h2><p>Coloque o dado em uma das três colunas que ainda tenha espaço.</p></div></div>
    <div className="rule-step"><b>3</b><div><h2>Multiplique combinações</h2><p>Dados iguais na mesma coluna multiplicam a pontuação.</p></div></div>
    <div className="example-row"><div><span><DiceFace value={4} small /><DiceFace value={4} small /></span><strong>4 × 2² = 16</strong></div><div><span><DiceFace value={4} small /><DiceFace value={4} small /><DiceFace value={4} small /></span><strong>4 × 3² = 36</strong></div></div>
    <div className="rule-step"><b>4</b><div><h2>Quebre a coluna rival</h2><p>O mesmo valor na coluna oposta destrói todos os dados iguais do adversário.</p></div></div>
    <div className="rule-step"><b>5</b><div><h2>Feche o tabuleiro</h2><p>Quando um tabuleiro encher, vence a maior pontuação.</p></div></div>
    <div className="rule-step"><b>●</b><div><h2>Ganhe moedas</h2><p>Vitórias contra bots rendem 10, 25 ou 50 moedas. Nas salas online, o criador pode definir uma aposta; o vencedor recebe o pote inteiro e, em caso de empate, as moedas são devolvidas.</p></div></div>
    <PixelButton onClick={() => navigate("/play")}>Começar um duelo</PixelButton><PixelButton variant="ghost" onClick={() => navigate("/")}>Voltar</PixelButton>
  </div></PageShell>;
}
