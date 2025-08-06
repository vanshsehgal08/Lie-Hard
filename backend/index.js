import express from "express";
import cors from "cors";
import { PORT, SELF_URL } from "./config.js";
import { registerRoutes } from "./routes.js";

const allowedOrigins = [
  "http://localhost:3000", // dev frontend
  "https://lie-hard.vercel.app", // deployed frontend
  "https://wit-link.vercel.app", // old frontend (keeping for backward compatibility)
];

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Simple in-memory storage for real-time updates
const clients = new Map(); // roomId -> Set of client connections
const pendingMessages = new Map(); // roomId -> Array of pending messages

// HTTP-based real-time communication endpoints
app.post("/api/join-room", async (req, res) => {
  try {
    const { roomId, playerName } = req.body;
    console.log(`Player ${playerName} joining room ${roomId}`);
    
    // Add client to room
    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }
    clients.get(roomId).add(res);
    
    // Send immediate response
    res.json({ success: true, message: "Joined room" });
    
    // Keep connection alive for long polling
    req.on('close', () => {
      if (clients.has(roomId)) {
        clients.get(roomId).delete(res);
      }
    });
    
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

app.post("/api/send-message", async (req, res) => {
  try {
    const { roomId, playerName, message, type } = req.body;
    console.log(`Message from ${playerName} in room ${roomId}:`, message);
    
    const messageData = {
      playerName,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    // Store message for room
    if (!pendingMessages.has(roomId)) {
      pendingMessages.set(roomId, []);
    }
    pendingMessages.get(roomId).push(messageData);
    
    // Notify all clients in room
    if (clients.has(roomId)) {
      clients.get(roomId).forEach(clientRes => {
        try {
          clientRes.write(`data: ${JSON.stringify(messageData)}\n\n`);
        } catch (e) {
          console.error("Error sending to client:", e);
        }
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/room-updates/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.query;
    
    console.log(`Client ${playerName} listening for updates in room ${roomId}`);
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to room updates' })}\n\n`);
    
    // Add client to room
    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }
    clients.get(roomId).add(res);
    
    // Send any pending messages
    if (pendingMessages.has(roomId)) {
      pendingMessages.get(roomId).forEach(msg => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
      });
    }
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);
    
    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      if (clients.has(roomId)) {
        clients.get(roomId).delete(res);
      }
      console.log(`Client ${playerName} disconnected from room ${roomId}`);
    });
    
  } catch (error) {
    console.error("Error in room updates:", error);
    res.status(500).end();
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

registerRoutes(app);

// For Vercel serverless, we don't need to listen on a port
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Self pinging for health check (only in production)
if (process.env.NODE_ENV === 'production') {
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
}

// Export for Vercel
export default app;
