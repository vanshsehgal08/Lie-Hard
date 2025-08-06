import React, { useEffect, useState } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const WebRTCTest = ({ socket, room, currentUserId }) => {
  const [testMode, setTestMode] = useState(false);
  
  const {
    isAudioEnabled,
    isListening,
    remoteStreams,
    toggleMute,
    toggleListening
  } = useWebRTC(socket, room?.id, room?.players || [], currentUserId);

  const handleTestAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Create a test audio element
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 0.5;
      document.body.appendChild(audioElement);
      
      // Stop after 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
      }, 3000);
      
      console.log('Test audio started');
    } catch (error) {
      console.error('Error testing audio:', error);
    }
  };

  return (
    <div className="card-premium p-6 rounded-2xl border border-purple-500/20">
      <h3 className="font-heading text-xl font-bold text-white mb-4">WebRTC Audio Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-300">Audio: {isAudioEnabled ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${remoteStreams.size > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-gray-300">Peers: {remoteStreams.size} connected</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestAudio}
            className="btn-premium px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Test Microphone
          </button>
          
          <button
            onClick={toggleMute}
            className={`btn-premium px-4 py-2 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
            }`}
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={toggleListening}
            className={`btn-premium px-4 py-2 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
            }`}
          >
            {isListening ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="text-sm text-gray-400">
          <p>• Test Microphone: Plays your audio for 3 seconds</p>
          <p>• Mute/Unmute: Toggle your microphone</p>
          <p>• Listen/Mute: Toggle hearing other players</p>
          <p>• Status indicators show connection state</p>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTest; 