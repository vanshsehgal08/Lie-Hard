import { createClient } from 'redis';

// Fallback to in-memory storage for development
const isDevelopment = process.env.NODE_ENV !== 'production';

class RoomStorage {
  constructor() {
    this.memoryRooms = new Map();
    this.redisClient = null;
    
    // Initialize Redis client if REDIS_URL is available
    if (process.env.REDIS_URL && !isDevelopment) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      
      this.redisClient.connect().catch(console.error);
    }
  }

  async getRoom(roomId) {
    if (isDevelopment || !this.redisClient) {
      return this.memoryRooms.get(roomId);
    }
    
    try {
      const roomData = await this.redisClient.get(`room:${roomId}`);
      return roomData ? JSON.parse(roomData) : null;
    } catch (error) {
      console.error('Error getting room from Redis:', error);
      return null;
    }
  }

  async setRoom(roomId, roomData) {
    if (isDevelopment || !this.redisClient) {
      this.memoryRooms.set(roomId, roomData);
      return;
    }
    
    try {
      await this.redisClient.setEx(`room:${roomId}`, 3600, JSON.stringify(roomData)); // 1 hour expiry
    } catch (error) {
      console.error('Error setting room in Redis:', error);
    }
  }

  async deleteRoom(roomId) {
    if (isDevelopment || !this.redisClient) {
      this.memoryRooms.delete(roomId);
      return;
    }
    
    try {
      await this.redisClient.del(`room:${roomId}`);
    } catch (error) {
      console.error('Error deleting room from Redis:', error);
    }
  }

  async getAllRooms() {
    if (isDevelopment || !this.redisClient) {
      return Array.from(this.memoryRooms.values());
    }
    
    try {
      const keys = await this.redisClient.keys('room:*');
      const rooms = [];
      for (const key of keys) {
        const roomData = await this.redisClient.get(key);
        if (roomData) {
          rooms.push(JSON.parse(roomData));
        }
      }
      return rooms;
    } catch (error) {
      console.error('Error getting all rooms from Redis:', error);
      return [];
    }
  }
}

export const roomStorage = new RoomStorage(); 