import React, { useState } from "react";
import { toast } from "sonner";

const VotingPhase = ({ room, socket, timeLeft, currentPlayerId }) => {
  const [currentVote, setCurrentVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  const isCurrentPlayer = currentPlayerId === room.currentPlayer;

  const handleSubmitVote = () => {
    if (currentVote === null) {
      toast.error("Please select a story to vote for");
      return;
    }
    
    if (isCurrentPlayer) {
      toast.error("You cannot vote for your own stories");
      return;
    }
    
    socket.emit("submit-vote", { roomId: room.id, guessedIndex: currentVote });
    setHasVoted(true);
    toast.success("Vote submitted!");
  };

  // Don't show voting interface to the current player (hot seat)
  if (isCurrentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <h2 className="text-3xl font-bold text-gray-800">Waiting for Votes</h2>
        <p className="text-gray-600 text-center">
          Other players are voting on your stories. Please wait...
        </p>
        <div className="text-2xl font-bold text-blue-600">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-3xl font-bold text-gray-800">Time to Vote!</h2>
      <p className="text-gray-600 text-center">
        Which story do you think is true? (Your vote is private)
      </p>
      
      <div className="text-2xl font-bold text-blue-600 mb-6">
        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
      
      {!hasVoted ? (
        <div className="w-full max-w-2xl space-y-4">
          {currentPlayer?.stories.map((story, index) => (
            <button
              key={index}
              onClick={() => setCurrentVote(index)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                currentVote === index
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold mb-2">Story {index + 1}:</div>
              <div>{story}</div>
            </button>
          ))}
          
          <button
            onClick={handleSubmitVote}
            disabled={currentVote === null}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              currentVote === null
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Submit Vote
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-green-600 text-xl font-semibold mb-2">✓ Vote Submitted!</div>
          <p className="text-gray-600">Waiting for other players to vote...</p>
        </div>
      )}
    </div>
  );
};

export default VotingPhase; 