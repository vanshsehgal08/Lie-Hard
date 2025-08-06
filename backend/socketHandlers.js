import { nanoid } from "nanoid";
import { 
  createRoom, 
  addPlayerToRoom, 
  removePlayerFromRoom, 
  submitStories, 
  submitVote, 
  calculateScores, 
  nextRound, 
  resetRoom,
  updateGameSettings,
  GameState
} from "./rooms.js";
import { roomStorage } from "./storage.js";

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const name = socket.handshake.auth?.name;
    if (!name) {
      return next(new Error("Name is required"));
    }
    socket.playerName = name;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User connected with id ${socket.id}`);

    // Create room
    socket.on("make-room", async ({ isPrivate = true }, callback) => {
      console.log(`Make room request by ${socket.playerName}`);
      
      try {
        const roomId = nanoid(6);
        console.log(`Generated room ID: ${roomId}`);
        
        const room = await createRoom(roomId, socket.id, socket.playerName);
        console.log(`Room created successfully: ${roomId}`);
        
        socket.join(roomId);
        
        console.log(`${socket.playerName} made and joined room: ${roomId}`);
        
        if (callback) {
          callback(roomId);
        }
        
        io.to(roomId).emit("room-joined", room);
      } catch (error) {
        console.error(`Error in make-room handler:`, error);
        if (callback) {
          callback(null);
        }
        socket.emit("room-error", "Failed to create room");
      }
    });

    // Join room
    socket.on("join-room", async (roomId) => {
      console.log(`Join room request: ${roomId} by ${socket.playerName}`);
      
      try {
        const room = await roomStorage.getRoom(roomId);
        console.log(`Room lookup result for ${roomId}:`, room ? 'Found' : 'Not found');
        
        if (!room) {
          console.log(`Room ${roomId} does not exist`);
          socket.emit("room-error", "Room does not exist");
          return;
        }
        
        console.log(`Attempting to add player ${socket.playerName} to room ${roomId}`);
        const result = await addPlayerToRoom(roomId, socket.id, socket.playerName);
        
        if (result && result.error) {
          console.log(`Error adding player to room: ${result.error}`);
          socket.emit("room-error", result.error);
          return;
        }
        
        socket.join(roomId);
        const updatedRoom = await roomStorage.getRoom(roomId);
        console.log(`Player ${socket.playerName} successfully joined room ${roomId}`);
        
        io.to(roomId).emit("player-joined", {
          roomId,
          player: { id: socket.id, name: socket.playerName },
          players: updatedRoom.players,
        });
        
        console.log(`${socket.playerName} joined room: ${roomId}`);
      } catch (error) {
        console.error(`Error in join-room handler:`, error);
        socket.emit("room-error", "Server error occurred while joining room");
      }
    });

    // Get users in room
    socket.on("get-room-users", async (roomId) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      socket.emit("room-users", {
        roomId,
        host: room.hostId,
        players: room.players,
      });
      socket.emit("room-joined", room);
    });

    // Update game settings (host only)
    socket.on("update-game-settings", async ({ roomId, settings }) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      if (room.hostId !== socket.id) {
        socket.emit("room-error", "Only the host can update game settings");
        return;
      }
      
      const updatedRoom = await updateGameSettings(roomId, settings);
      if (updatedRoom) {
        io.to(roomId).emit("game-settings-updated", updatedRoom);
      }
    });

    // Submit stories
    socket.on("submit-stories", async ({ roomId, stories, isTruth }) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      const updatedRoom = await submitStories(roomId, socket.id, stories, isTruth);
      if (!updatedRoom) {
        socket.emit("room-error", "Failed to submit stories");
        return;
      }
      
      io.to(roomId).emit("stories-submitted", {
        playerId: socket.id,
        room: updatedRoom
      });
      
      // If all players have submitted, start the game
      if (updatedRoom.status === GameState.QUESTIONING) {
        io.to(roomId).emit("game-started", updatedRoom);
        startQuestioningRound(io, roomId);
      }
    });

    // Submit vote
    socket.on("submit-vote", async ({ roomId, guessedIndex }) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      const updatedRoom = await submitVote(roomId, socket.id, guessedIndex);
      if (!updatedRoom) {
        socket.emit("room-error", "Failed to submit vote");
        return;
      }
      
      io.to(roomId).emit("vote-submitted", {
        playerId: socket.id,
        room: updatedRoom
      });
      
      // If all players have voted, start result timer
      if (updatedRoom.status === GameState.REVEAL) {
        startResultTimer(io, roomId);
      }
    });

    // Start game (host only)
    socket.on("start-game", async (roomId) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      if (room.hostId !== socket.id) {
        socket.emit("room-error", "Only the host can start the game");
        return;
      }
      
      if (room.players.length < 2) {
        socket.emit("room-error", "Need at least 2 players to start");
        return;
      }
      
      room.status = GameState.STORY_SUBMISSION;
      io.to(roomId).emit("story-submission-started", room);
    });

    // Reset game
    socket.on("reset-game", async (roomId) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      if (room.hostId !== socket.id) {
        socket.emit("room-error", "Only the host can reset the game");
        return;
      }
      
      const resetRoomData = await resetRoom(roomId);
      io.to(roomId).emit("game-reset", resetRoomData);
    });

    // Chat messages
    socket.on("chat-message", async ({ roomId, message }) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit("room-error", "Player not found in room");
        return;
      }
      
      const chatMessage = {
        id: nanoid(8),
        player: {
          id: player.id,
          name: player.name,
        },
        message,
        timestamp: Date.now(),
      };
      
      room.chatHistory.push(chatMessage);
      
      io.to(roomId).emit("chat-message", chatMessage);
    });

    // WebRTC signaling for voice chat
    socket.on("webrtc-signal", async ({ roomId, targetId, signal }) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit("room-error", "Player not found in room");
        return;
      }
      
      // Forward the signal to the target player
      io.to(targetId).emit("webrtc-signal", {
        fromId: socket.id,
        signal: signal
      });
    });

    // Leave room
    socket.on("leave-room", async (roomId) => {
      const room = await roomStorage.getRoom(roomId);
      if (!room) {
        socket.emit("room-error", "Room does not exist");
        return;
      }
      
      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit("room-error", "Player not found in room");
        return;
      }
      
      const playerName = player.name;
      const updatedRoom = await removePlayerFromRoom(roomId, socket.id);
      
      if (!updatedRoom) {
        // Room was deleted
        io.to(roomId).emit("room-closed", {
          message: "Room has been closed.",
        });
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        for (const clientId of clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.leave(roomId);
          }
        }
      } else {
        io.to(roomId).emit("player-left", {
          playerId: socket.id,
          playerName,
          players: updatedRoom.players,
        });
      }
      
      socket.leave(roomId);
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected with id ${socket.id}`);
      
      // Find all rooms this user was in and remove them
      const allRooms = await roomStorage.getAllRooms();
      for (const room of allRooms) {
        const wasInRoom = room.players.some(p => p.id === socket.id);
        if (wasInRoom) {
          const playerName = room.players.find(p => p.id === socket.id).name;
          const updatedRoom = await removePlayerFromRoom(room.id, socket.id);
          
          if (!updatedRoom) {
            // Room was deleted (no players left)
            io.to(room.id).emit("room-deleted");
          } else {
            // Player was removed from room
            io.to(room.id).emit("player-left", {
              playerId: socket.id,
              playerName: playerName,
              room: updatedRoom
            });
          }
        }
      }
    });
  });
}

// Helper function to start a questioning round
function startQuestioningRound(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  if (!currentPlayer) return;
  
  // Start timer for questioning round
  let timeLeft = room.gameSettings.roundTime;
  
  const timer = setInterval(() => {
    timeLeft -= 1;
    
    io.to(roomId).emit("timer-update", {
      timeLeft,
      currentPlayer: room.currentPlayer
    });
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      
      // Move to voting phase
      room.status = GameState.VOTING;
      io.to(roomId).emit("voting-started", room);
      
      // Start voting timer
      let votingTimeLeft = room.gameSettings.questionTime;
      const votingTimer = setInterval(() => {
        votingTimeLeft -= 1;
        
        io.to(roomId).emit("voting-timer-update", {
          timeLeft: votingTimeLeft
        });
        
        if (votingTimeLeft <= 0) {
          clearInterval(votingTimer);
          
          // Force reveal if not all votes are in
          if (room.status === GameState.VOTING) {
            startResultTimer(io, roomId);
          }
        }
      }, 1000);
    }
  }, 1000);
}

// Helper function to start result timer
function startResultTimer(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  // Calculate scores first
  const updatedRoom = calculateScores(roomId);
  io.to(roomId).emit("reveal-results", updatedRoom);
  
  // Start 10-second result timer
  let resultTimeLeft = room.gameSettings.resultTime;
  
  const resultTimer = setInterval(() => {
    resultTimeLeft -= 1;
    
    io.to(roomId).emit("result-timer-update", {
      timeLeft: resultTimeLeft
    });
    
    if (resultTimeLeft <= 0) {
      clearInterval(resultTimer);
      
      // Move to next round
      const nextRoom = nextRound(roomId);
      if (nextRoom) {
        if (nextRoom.status === GameState.GAME_OVER) {
          io.to(roomId).emit("game-over", nextRoom);
        } else {
          io.to(roomId).emit("next-round", nextRoom);
          startQuestioningRound(io, roomId);
        }
      }
    }
  }, 1000);
}

