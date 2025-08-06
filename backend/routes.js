import { roomStorage } from './storage.js';

// Simple in-memory storage for real-time updates
const clients = new Map(); // roomId -> Set of client connections
const pendingMessages = new Map(); // roomId -> Array of pending messages

export function registerRoutes(app) {
  // Simple test endpoint
  app.get("/api/join-room-test", (req, res) => {
    res.json({ success: true, message: "Join room test endpoint working" });
  });

  // Test endpoint to verify backend is working
  app.get("/api/test", async (req, res) => {
    try {
      // Test Redis connection
      const testKey = "test:connection";
      await roomStorage.setRoom(testKey, { test: true, timestamp: Date.now() });
      const testData = await roomStorage.getRoom(testKey);
      await roomStorage.deleteRoom(testKey);
      
      res.json({ 
        status: "OK", 
        message: "Backend is working",
        redis: testData ? "Connected" : "Using fallback",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Test endpoint error:", error);
      res.status(500).json({ 
        status: "ERROR", 
        message: "Backend error",
        error: error.message 
      });
    }
  });

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

  // Get room information
  app.get("/api/room/:roomId", async (req, res) => {
    const { roomId } = req.params;
    const room = await roomStorage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ room });
  });

  // Get all active rooms (for future public room listing)
  app.get("/api/rooms", async (req, res) => {
    const allRooms = await roomStorage.getAllRooms();
    const activeRooms = allRooms.filter(room => 
      room.status === 'WAITING' && room.players.length < room.maxPlayers
    );
    res.json({ rooms: activeRooms });
  });

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.send("Lie Hard Game Server is running!");
  });
}
