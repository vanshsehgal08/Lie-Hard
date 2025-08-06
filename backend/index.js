import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PORT, SELF_URL } from "./config.js";
import { registerSocketHandlers } from "./socketHandlers.js";
import { registerRoutes } from "./routes.js";

const allowedOrigins = [
  "http://localhost:3000", // dev frontend
  "https://lie-hard.vercel.app", // deployed frontend
  "https://wit-link.vercel.app", // old frontend (keeping for backward compatibility)
];

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
  allowUpgrades: true,
  maxHttpBufferSize: 1e8
});

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

registerSocketHandlers(io);
registerRoutes(app);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Self pinging for health check
setInterval(() => {
  fetch(SELF_URL)
    .then((res) => {
      if (res.ok) {
        console.log(`Self-ping at ${new Date()}`);
      } else {
        console.error(`Self-ping failed with status ${res.status}`);
      }
    })
    .catch((err) => {
      console.error(`Self-ping error:`, err.message);
    });
}, 13 * 60 * 1000);
