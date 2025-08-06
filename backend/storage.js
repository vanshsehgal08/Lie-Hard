import { createClient } from 'redis';

// Fallback to in-memory storage for development
const isDevelopment = process.env.NODE_ENV !== 'production';

class RoomStorage {
  constructor() {
    this.memoryRooms = new Map();
    this.redisClient = null;
    this.isConnected = false;
    
    // Initialize Redis client if REDIS_URL is available
    if (process.env.REDIS_URL && !isDevelopment) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });
      
      this.redisClient.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });
      
      this.redisClient.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });
      
      // Connect to Redis
      this.connectRedis();
    }
  }

  async connectRedis() {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.connect();
      this.isConnected = true;
      console.log('Redis connection established');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async getRoom(roomId) {
    // Always use in-memory for development
    if (isDevelopment) {
      return this.memoryRooms.get(roomId);
    }
    
    // Use Redis if available and connected
    if (this.redisClient && this.isConnected) {
      try {
        const roomData = await this.redisClient.get(`room:${roomId}`);
        return roomData ? JSON.parse(roomData) : null;
      } catch (error) {
        console.error('Error getting room from Redis:', error);
        // Fallback to in-memory
        return this.memoryRooms.get(roomId);
      }
    }
    
    // Fallback to in-memory storage
    return this.memoryRooms.get(roomId);
  }

  async setRoom(roomId, roomData) {
    // Always use in-memory for development
    if (isDevelopment) {
      this.memoryRooms.set(roomId, roomData);
      return;
    }
    
    // Store in memory as backup
    this.memoryRooms.set(roomId, roomData);
    
    // Use Redis if available and connected
    if (this.redisClient && this.isConnected) {
      try {
        await this.redisClient.setEx(`room:${roomId}`, 3600, JSON.stringify(roomData)); // 1 hour expiry
        console.log(`Room ${roomId} saved to Redis`);
      } catch (error) {
        console.error('Error setting room in Redis:', error);
        // Continue with in-memory storage
      }
    }
  }

  async deleteRoom(roomId) {
    // Always use in-memory for development
    if (isDevelopment) {
      this.memoryRooms.delete(roomId);
      return;
    }
    
    // Remove from memory
    this.memoryRooms.delete(roomId);
    
    // Use Redis if available and connected
    if (this.redisClient && this.isConnected) {
      try {
        await this.redisClient.del(`room:${roomId}`);
        console.log(`Room ${roomId} deleted from Redis`);
      } catch (error) {
        console.error('Error deleting room from Redis:', error);
      }
    }
  }

  async getAllRooms() {
    // Always use in-memory for development
    if (isDevelopment) {
      return Array.from(this.memoryRooms.values());
    }
    
    // Use Redis if available and connected
    if (this.redisClient && this.isConnected) {
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
        // Fallback to in-memory
        return Array.from(this.memoryRooms.values());
      }
    }
    
    // Fallback to in-memory storage
    return Array.from(this.memoryRooms.values());
  }
}

export const roomStorage = new RoomStorage(); 