import { roomStorage } from './storage.js';

// Simple in-memory storage for real-time updates
const clients = new Map(); // roomId -> Set of client connections
const pendingMessages = new Map(); // roomId -> Array of pending messages
const roomStates = new Map(); // roomId -> room state

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

  // Create or join a room
  app.post("/api/join-room", async (req, res) => {
    try {
      const { roomId, playerName } = req.body;
      console.log(`Player ${playerName} joining room ${roomId}`);
      
      // Get or create room state
      let roomState = roomStates.get(roomId);
      if (!roomState) {
        roomState = {
          id: roomId,
          players: [],
          status: "WAITING",
          currentRound: 0,
          currentPlayer: null,
          hostId: null,
          votes: new Map(),
          chatHistory: [],
          createdAt: new Date().toISOString()
        };
        roomStates.set(roomId, roomState);
      }
      
      // Check if player already exists in room
      const existingPlayer = roomState.players.find(p => p.name === playerName);
      if (existingPlayer) {
        return res.json({ 
          success: true, 
          message: "Rejoined room",
          roomState,
          isHost: existingPlayer.id === roomState.hostId
        });
      }
      
      // Add new player
      const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newPlayer = {
        id: playerId,
        name: playerName,
        score: 0
      };
      
      roomState.players.push(newPlayer);
      
      // Set host if first player
      if (roomState.players.length === 1) {
        roomState.hostId = playerId;
      }
      
      // Store room state
      roomStates.set(roomId, roomState);
      await roomStorage.setRoom(roomId, roomState);
      
      // Add client to room for real-time updates
      if (!clients.has(roomId)) {
        clients.set(roomId, new Set());
      }
      clients.get(roomId).add(res);
      
      // Send immediate response
      res.json({ 
        success: true, 
        message: "Joined room",
        roomState,
        isHost: playerId === roomState.hostId
      });
      
      // Notify other players about new player
      notifyRoomUpdate(roomId, {
        type: 'player_joined',
        playerId,
        playerName,
        roomState
      });
      
      // Keep connection alive for long polling
      req.on('close', () => {
        if (clients.has(roomId)) {
          clients.get(roomId).delete(res);
        }
        // Remove player when they disconnect
        roomState.players = roomState.players.filter(p => p.id !== playerId);
        if (roomState.players.length === 0) {
          roomStates.delete(roomId);
          clients.delete(roomId);
          pendingMessages.delete(roomId);
        } else {
          // Reassign host if host left
          if (roomState.hostId === playerId) {
            roomState.hostId = roomState.players[0].id;
          }
          roomStates.set(roomId, roomState);
          notifyRoomUpdate(roomId, {
            type: 'player_left',
            playerId,
            roomState
          });
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
      
      // Update room state if it's a room update
      if (type === 'room_update') {
        try {
          const roomData = JSON.parse(message);
          roomStates.set(roomId, roomData);
          await roomStorage.setRoom(roomId, roomData);
          
          // Notify all clients about room state change
          notifyRoomUpdate(roomId, {
            type: 'room_update',
            roomData
          });
        } catch (error) {
          console.error("Error parsing room update:", error);
        }
      } else {
        // Notify all clients about chat message
        notifyRoomUpdate(roomId, messageData);
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
      
      // Send current room state
      const roomState = roomStates.get(roomId);
      if (roomState) {
        res.write(`data: ${JSON.stringify({ type: 'room_state', roomState })}\n\n`);
      }
      
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

  // Helper function to notify all clients in a room
  function notifyRoomUpdate(roomId, data) {
    if (clients.has(roomId)) {
      clients.get(roomId).forEach(clientRes => {
        try {
          clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          console.error("Error sending to client:", e);
        }
      });
    }
  }

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
