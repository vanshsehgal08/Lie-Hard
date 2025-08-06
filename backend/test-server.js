import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is working",
    timestamp: new Date().toISOString()
  });
});

// Join room endpoint
app.post("/api/join-room", (req, res) => {
  const { roomId, playerName } = req.body;
  console.log(`Player ${playerName} joining room ${roomId}`);
  
  res.json({ 
    success: true, 
    message: "Joined room",
    roomId,
    playerName
  });
});

// Send message endpoint
app.post("/api/send-message", (req, res) => {
  const { roomId, playerName, message, type } = req.body;
  console.log(`Message from ${playerName} in room ${roomId}:`, message);
  
  res.json({ success: true });
});

// Room updates endpoint
app.get("/api/room-updates/:roomId", (req, res) => {
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
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);
  
  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    console.log(`Client ${playerName} disconnected from room ${roomId}`);
  });
});

app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
}); 