// Lie Hard Game Room Structure
// roomId: { 
//   id, 
//   players: [{ id, name, score, stories: [story1, story2, story3], isTruth: 0/1/2 }], 
//   status: ['WAITING', 'STORY_SUBMISSION', 'QUESTIONING', 'VOTING', 'REVEAL', 'GAME_OVER'],
//   currentRound: number,
//   currentPlayer: playerId,
//   roundTimer: number,
//   maxPlayers: 5,
//   hostId: string,
//   gameSettings: { roundTime: 120, questionTime: 30, resultTime: 10 }
// }

export const rooms = new Map();

// Game state management
export const GameState = {
  WAITING: 'WAITING',
  STORY_SUBMISSION: 'STORY_SUBMISSION', 
  QUESTIONING: 'QUESTIONING',
  VOTING: 'VOTING',
  REVEAL: 'REVEAL',
  GAME_OVER: 'GAME_OVER'
};

// Helper functions for game logic
export const createRoom = (roomId, hostId, hostName) => {
  const room = {
    id: roomId,
    players: [{
      id: hostId,
      name: hostName,
      score: 0,
      stories: [],
      isTruth: null,
      hasSubmitted: false
    }],
    status: GameState.WAITING,
    currentRound: 0,
    currentPlayer: null,
    roundTimer: null,
    maxPlayers: 5,
    hostId: hostId,
    gameSettings: {
      roundTime: 60, // 1 minute default for questioning (min: 60, max: 1200)
      questionTime: 30, // 30 seconds per question
      storySubmissionTime: 60, // 1 minute to submit stories
      resultTime: 10, // 10 seconds for result reveal
      maxPlayers: 5, // maximum players per room
      allowVoiceChat: true, // enable/disable voice chat
      allowTextChat: true, // enable/disable text chat
      autoStart: false // auto-start game when room is full
    },
    votes: new Map(), // playerId -> guessedIndex
    chatHistory: [],
    resultTimer: null
  };
  
  rooms.set(roomId, room);
  return room;
};

export const addPlayerToRoom = (roomId, playerId, playerName) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  if (room.players.length >= room.maxPlayers) {
    return { error: 'Room is full' };
  }
  
  const newPlayer = {
    id: playerId,
    name: playerName,
    score: 0,
    stories: [],
    isTruth: null,
    hasSubmitted: false
  };
  
  room.players.push(newPlayer);
  return room;
};

export const removePlayerFromRoom = (roomId, playerId) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.players = room.players.filter(p => p.id !== playerId);
  
  // If no players left, delete room
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  
  // If host left, assign new host
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }
  
  // If current player left, move to next
  if (room.currentPlayer === playerId) {
    const currentIndex = room.players.findIndex(p => p.id === playerId);
    const nextIndex = (currentIndex + 1) % room.players.length;
    room.currentPlayer = room.players[nextIndex]?.id || null;
  }
  
  return room;
};

export const updateGameSettings = (roomId, settings) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.gameSettings = { ...room.gameSettings, ...settings };
  return room;
};

export const submitStories = (roomId, playerId, stories, isTruth) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;
  
  player.stories = stories;
  player.isTruth = isTruth;
  player.hasSubmitted = true;
  
  // Check if all players have submitted
  const allSubmitted = room.players.every(p => p.hasSubmitted);
  if (allSubmitted && room.players.length >= 2) {
    room.status = GameState.QUESTIONING;
    room.currentRound = 1;
    room.currentPlayer = room.players[0].id;
  }
  
  return room;
};

export const submitVote = (roomId, playerId, guessedIndex) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.votes.set(playerId, guessedIndex);
  
  // Check if all players have voted
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  const voters = room.players.filter(p => p.id !== room.currentPlayer);
  const allVoted = voters.every(p => room.votes.has(p.id));
  
  if (allVoted) {
    room.status = GameState.REVEAL;
  }
  
  return room;
};

export const calculateScores = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  const correctAnswer = currentPlayer.isTruth;
  
  // Calculate scores
  room.players.forEach(player => {
    if (player.id === room.currentPlayer) {
      // Player gets points for fooling others
      const votes = Array.from(room.votes.values());
      const correctGuesses = votes.filter(vote => vote === correctAnswer).length;
      const totalVoters = votes.length;
      const fooledCount = totalVoters - correctGuesses;
      
      player.score += fooledCount; // +1 for each person fooled
      
      // Bonus if no one guessed correctly
      if (correctGuesses === 0) {
        player.score += 2;
      }
    } else {
      // Voter gets points for guessing correctly
      const vote = room.votes.get(player.id);
      if (vote === correctAnswer) {
        player.score += 1;
      }
    }
  });
  
  return room;
};

export const nextRound = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  // Clear votes for next round
  room.votes.clear();
  
  // Move to next player
  const currentIndex = room.players.findIndex(p => p.id === room.currentPlayer);
  const nextIndex = (currentIndex + 1) % room.players.length;
  
  if (nextIndex === 0) {
    // Game is over, all players have had their turn
    room.status = GameState.GAME_OVER;
    room.currentPlayer = null;
  } else {
    room.currentPlayer = room.players[nextIndex].id;
    room.status = GameState.QUESTIONING;
    room.currentRound++;
  }
  
  return room;
};

export const resetRoom = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.status = GameState.WAITING;
  room.currentRound = 0;
  room.currentPlayer = null;
  room.votes.clear();
  
  room.players.forEach(player => {
    player.stories = [];
    player.isTruth = null;
    player.hasSubmitted = false;
  });
  
  return room;
};
