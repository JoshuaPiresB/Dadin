import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";
import { BotSelectPage } from "./pages/BotSelectPage";
import { HowToPlayPage } from "./pages/HowToPlayPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const BotGamePage = lazy(() => import("./pages/BotGamePage").then((module) => ({ default: module.BotGamePage })));
const OnlinePage = lazy(() => import("./pages/OnlinePage").then((module) => ({ default: module.OnlinePage })));
const RoomPage = lazy(() => import("./pages/RoomPage").then((module) => ({ default: module.RoomPage })));
const JoinPage = lazy(() => import("./pages/JoinPage").then((module) => ({ default: module.JoinPage })));

export default function App() {
  return <BrowserRouter><Suspense fallback={<main className="route-loading"><div className="loading-die">⚄</div><p>CARREGANDO...</p></main>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/play" element={<PlayPage />} />
    <Route path="/play/bot" element={<BotSelectPage />} />
    <Route path="/play/bot/match" element={<BotGamePage />} />
    <Route path="/online" element={<OnlinePage />} />
    <Route path="/room/:roomCode" element={<RoomPage />} />
    <Route path="/join/:roomCode" element={<JoinPage />} />
    <Route path="/how-to-play" element={<HowToPlayPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/settings/*" element={<Navigate to="/settings" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></BrowserRouter>;
}
