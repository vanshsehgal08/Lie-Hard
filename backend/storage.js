// Simple in-memory storage for development
class RoomStorage {
  constructor() {
    this.memoryRooms = new Map();
    console.log('RoomStorage initialized with in-memory storage');
  }

  async getRoom(roomId) {
    return this.memoryRooms.get(roomId);
  }

  async setRoom(roomId, roomData) {
    this.memoryRooms.set(roomId, roomData);
    console.log(`Room ${roomId} saved to memory`);
  }

  async deleteRoom(roomId) {
    this.memoryRooms.delete(roomId);
    console.log(`Room ${roomId} deleted from memory`);
  }

  async getAllRooms() {
    return Array.from(this.memoryRooms.values());
  }
}

export const roomStorage = new RoomStorage(); 