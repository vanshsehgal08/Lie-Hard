export function registerRoutes(app, rooms) {
  // Get room information
  app.get("/api/room/:roomId", (req, res) => {
    const { roomId } = req.params;
    if (!rooms.has(roomId)) {
      return res.status(404).json({ error: "Room not found" });
    }
    const room = rooms.get(roomId);
    res.json({ room });
  });

  // Get all active rooms (for future public room listing)
  app.get("/api/rooms", (req, res) => {
    const activeRooms = Array.from(rooms.values()).filter(room => 
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
