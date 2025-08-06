import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// In-memory storage
const rooms = new Map();
const clients = new Map(); // roomId -> Set of client connections
const pendingMessages = new Map(); // roomId -> Array of pending messages

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "https://lie-hard.vercel.app"],
  credentials: true
}));

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is working",
    timestamp: new Date().toISOString()
  });
});

// Join room endpoint
app.post("/api/join-room", (req, res) => {
  try {
    const { roomId, playerName } = req.body;
    console.log(`Player ${playerName} joining room ${roomId}`);
    
    // Get or create room
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        status: "WAITING",
        currentRound: 0,
        currentPlayer: null,
        hostId: null,
        votes: {},
        chatHistory: [],
        createdAt: new Date().toISOString()
      };
      rooms.set(roomId, room);
    }
    
    // Check if player already exists
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer) {
      return res.json({ 
        success: true, 
        message: "Rejoined room",
        roomState: room,
        isHost: existingPlayer.id === room.hostId
      });
    }
    
    // Add new player
    const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newPlayer = {
      id: playerId,
      name: playerName,
      score: 0
    };
    
    room.players.push(newPlayer);
    
    // Set host if first player
    if (room.players.length === 1) {
      room.hostId = playerId;
    }
    
    // Store room
    rooms.set(roomId, room);
    
    // Add client to room
    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }
    clients.get(roomId).add(res);
    
    // Send response
    res.json({ 
      success: true, 
      message: "Joined room",
      roomState: room,
      isHost: playerId === room.hostId
    });
    
    // Notify other players
    notifyRoomUpdate(roomId, {
      type: 'player_joined',
      playerId,
      playerName,
      roomState: room
    });
    
    // Clean up on disconnect
    req.on('close', () => {
      if (clients.has(roomId)) {
        clients.get(roomId).delete(res);
      }
      // Remove player
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) {
        rooms.delete(roomId);
        clients.delete(roomId);
        pendingMessages.delete(roomId);
      } else {
        // Reassign host if host left
        if (room.hostId === playerId) {
          room.hostId = room.players[0].id;
        }
        rooms.set(roomId, room);
        notifyRoomUpdate(roomId, {
          type: 'player_left',
          playerId,
          roomState: room
        });
      }
    });
    
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Send message endpoint
app.post("/api/send-message", (req, res) => {
  try {
    const { roomId, playerName, message, type } = req.body;
    console.log(`Message from ${playerName} in room ${roomId}:`, message);
    
    const messageData = {
      playerName,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    // Store message
    if (!pendingMessages.has(roomId)) {
      pendingMessages.set(roomId, []);
    }
    pendingMessages.get(roomId).push(messageData);
    
    // Update room state if it's a room update
    if (type === 'room_update') {
      try {
        const roomData = JSON.parse(message);
        rooms.set(roomId, roomData);
        
        notifyRoomUpdate(roomId, {
          type: 'room_update',
          roomData
        });
      } catch (error) {
        console.error("Error parsing room update:", error);
      }
    } else {
      // Notify about chat message
      notifyRoomUpdate(roomId, messageData);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Room updates endpoint (Server-Sent Events)
app.get("/api/room-updates/:roomId", (req, res) => {
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
    const room = rooms.get(roomId);
    if (room) {
      res.write(`data: ${JSON.stringify({ type: 'room_state', roomState: room })}\n\n`);
    }
    
    // Add client to room
    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }
    clients.get(roomId).add(res);
    
    // Send pending messages
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

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Lie Hard Game Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 