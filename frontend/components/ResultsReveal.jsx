import React from "react";

const ResultsReveal = ({ room, timeLeft }) => {
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  const trueStoryIndex = currentPlayer?.isTruth;
  const trueStory = currentPlayer?.stories[trueStoryIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-3xl font-bold text-gray-800">Results Revealed!</h2>
      
      <div className="text-2xl font-bold text-blue-600 mb-4">
        Next round in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
      
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center p-6 bg-green-100 border border-green-300 rounded-lg">
          <div className="text-xl font-semibold text-green-800 mb-2">
            The TRUE story was: Story {trueStoryIndex + 1}
          </div>
          <div className="text-gray-700">{trueStory}</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {room.players.map((player) => (
            <div key={player.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-800">{player.name}</div>
              <div className="text-sm text-gray-600">Score: {player.score}</div>
            </div>
          ))}
        </div>
        
        <div className="text-center p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-gray-700">
            Next round starting soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsReveal; 