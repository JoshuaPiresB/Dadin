import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GAME_TITLE } from "@pixel-dice-duel/shared";
import { env } from "./config/env.js";
import { DiceDuelRoom } from "./rooms/DiceDuelRoom.js";
import { findRoomId } from "./services/roomRegistry.js";
import { validateRoomCode } from "./utils/validation.js";

const app = express();
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_request, response) => response.json({ ok: true, game: GAME_TITLE }));
app.get("/api/rooms/:roomCode", (request, response) => {
  try {
    const code = validateRoomCode(request.params.roomCode);
    const roomId = findRoomId(code);
    if (!roomId) return response.status(404).json({ error: "Não conseguimos encontrar essa sala." });
    return response.json({ roomId, roomCode: code });
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : "Código inválido." });
  }
});

const httpServer = createServer(app);
const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
gameServer.define("dice_duel", DiceDuelRoom);

await gameServer.listen(env.port, "0.0.0.0");
console.info(`${GAME_TITLE} server listening on http://localhost:${env.port}`);
