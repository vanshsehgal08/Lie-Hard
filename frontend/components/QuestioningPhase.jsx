import React from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

const QuestioningPhase = ({ room, socket, isCurrentPlayer, timeLeft, isMuted, setIsMuted }) => {
  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  
  // Use WebRTC hook
  const {
    isAudioEnabled,
    isListening,
    remoteStreams,
    toggleMute,
    toggleListening
  } = useWebRTC(socket, room.id, room.players, socket?.id);

  // Handle mute toggle
  const handleToggleMute = () => {
    const newMutedState = toggleMute();
    setIsMuted(newMutedState);
  };

  // Handle listening toggle
  const handleToggleListening = () => {
    toggleListening();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="font-display text-3xl font-black gradient-premium-text">
        {isCurrentPlayer ? "You're in the Hot Seat!" : `${currentPlayer?.name} is in the Hot Seat`}
      </h2>
      
      <div className="text-center space-y-4">
        <p className="font-heading text-xl text-gray-300 max-w-2xl leading-relaxed">
          {isCurrentPlayer 
            ? "Others will ask you questions about your stories. Answer carefully!"
            : "Ask questions to figure out which story is true!"
          }
        </p>
        
        <div className="text-3xl font-bold gradient-premium-text mb-6">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`btn-premium flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              isMuted 
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span className="font-heading font-semibold">{isMuted ? 'Unmute' : 'Muted'}</span>
          </button>
          
          <button
            onClick={handleToggleListening}
            className={`btn-premium flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              isListening 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
            }`}
          >
            {isListening ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="font-heading font-semibold">{isListening ? 'Listening' : 'Muted'}</span>
          </button>
        </div>
      </div>
      
      {/* Audio status indicators */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>Audio: {isAudioEnabled ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${remoteStreams.size > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span>Peers: {remoteStreams.size} connected</span>
        </div>
      </div>
      
      {/* Show current player's stories to everyone */}
      <div className="w-full max-w-2xl space-y-4">
        <h3 className="font-heading text-xl font-bold text-white">
          {isCurrentPlayer ? "Your Stories:" : `${currentPlayer?.name}'s Stories:`}
        </h3>
        {currentPlayer?.stories.map((story, index) => (
          <div key={index} className="card-premium p-6 rounded-2xl border border-purple-500/20">
            <div className="font-heading font-semibold text-purple-300 mb-2">Story {index + 1}:</div>
            <div className="text-gray-300">{story}</div>
          </div>
        ))}
      </div>
      
      {!isCurrentPlayer && (
        <div className="w-full max-w-2xl space-y-4">
          <h3 className="font-heading text-xl font-bold text-white">Ask Questions:</h3>
          <div className="card-premium p-6 rounded-2xl border border-purple-500/20">
            <p className="text-gray-300">
              Use the chat or voice to ask {currentPlayer?.name} questions about their stories. 
              Try to figure out which one is true!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestioningPhase; 