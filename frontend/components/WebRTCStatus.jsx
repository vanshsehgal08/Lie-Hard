import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Mic, MicOff } from 'lucide-react';

const WebRTCStatus = ({ socket, room, currentUserId }) => {
  const [connectionStates, setConnectionStates] = useState(new Map());
  const [audioStatus, setAudioStatus] = useState('disconnected');

  useEffect(() => {
    if (!socket || !room) return;

    const handleWebRTCSignal = ({ fromId, signal }) => {
      console.log(`WebRTC Status: Signal from ${fromId} - ${signal.type}`);
    };

    socket.on("webrtc-signal", handleWebRTCSignal);

    return () => {
      socket.off("webrtc-signal", handleWebRTCSignal);
    };
  }, [socket, room]);

  const testMicrophone = async () => {
    try {
      setAudioStatus('testing');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Create test audio element
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 0.3;
      document.body.appendChild(audioElement);
      
      setAudioStatus('connected');
      
      // Cleanup after 2 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
        setAudioStatus('disconnected');
      }, 2000);
      
    } catch (error) {
      console.error('Microphone test failed:', error);
      setAudioStatus('error');
    }
  };

  return (
    <div className="card-premium p-4 rounded-xl border border-purple-500/20">
      <h4 className="font-heading text-lg font-bold text-white mb-3">WebRTC Status</h4>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Microphone:</span>
          <div className="flex items-center gap-2">
            {audioStatus === 'connected' && <Mic className="h-4 w-4 text-green-500" />}
            {audioStatus === 'testing' && <Mic className="h-4 w-4 text-yellow-500 animate-pulse" />}
            {audioStatus === 'error' && <MicOff className="h-4 w-4 text-red-500" />}
            {audioStatus === 'disconnected' && <MicOff className="h-4 w-4 text-gray-500" />}
            <span className={`text-xs ${
              audioStatus === 'connected' ? 'text-green-500' :
              audioStatus === 'testing' ? 'text-yellow-500' :
              audioStatus === 'error' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {audioStatus.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Socket:</span>
          <div className="flex items-center gap-2">
            {socket?.connected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span className={`text-xs ${socket?.connected ? 'text-green-500' : 'text-red-500'}`}>
              {socket?.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Room:</span>
          <span className="text-xs text-purple-400">{room?.id || 'N/A'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Players:</span>
          <span className="text-xs text-blue-400">{room?.players?.length || 0}</span>
        </div>
        
        <button
          onClick={testMicrophone}
          disabled={audioStatus === 'testing'}
          className="btn-premium w-full px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
        >
          Test Microphone
        </button>
      </div>
    </div>
  );
};

export default WebRTCStatus; 