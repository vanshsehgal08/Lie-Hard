import { roomStorage } from './storage.js';

export function registerRoutes(app, rooms) {
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
