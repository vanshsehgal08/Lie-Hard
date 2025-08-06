import React from "react";

const GameOver = ({ room, isHost, onResetGame }) => {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-3xl font-bold text-gray-800">Game Over!</h2>
      
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center p-6 bg-yellow-100 border border-yellow-300 rounded-lg">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">Final Scores</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-white rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow-600">#{index + 1}</span>
                  <span className="font-semibold">{player.name}</span>
                  {index === 0 && (
                    <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">WINNER!</span>
                  )}
                </div>
                <span className="text-lg font-bold text-blue-600">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>
        
        {isHost && (
          <button
            onClick={onResetGame}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Play Again
          </button>
        )}
        
        {!isHost && (
          <div className="text-center p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-gray-700">
              Waiting for host to start a new game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOver; 