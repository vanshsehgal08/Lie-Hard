import { roomStorage } from './storage.js';

export function registerRoutes(app, rooms) {
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
