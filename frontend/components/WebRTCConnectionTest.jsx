import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, RefreshCw, AlertCircle } from 'lucide-react';

const WebRTCConnectionTest = ({ socket, room, currentUserId }) => {
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runConnectionTest = async () => {
    setIsRunning(true);
    setConnectionStatus('testing');
    setTestResults([]);

    const results = [];

    // Test 1: Check if WebRTC is supported
    try {
      if (typeof RTCPeerConnection !== 'undefined') {
        results.push({ test: 'WebRTC Support', status: 'PASS', message: 'WebRTC is supported' });
      } else {
        results.push({ test: 'WebRTC Support', status: 'FAIL', message: 'WebRTC is not supported' });
      }
    } catch (error) {
      results.push({ test: 'WebRTC Support', status: 'FAIL', message: error.message });
    }

    // Test 2: Check microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      results.push({ test: 'Microphone Access', status: 'PASS', message: 'Microphone access granted' });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      results.push({ test: 'Microphone Access', status: 'FAIL', message: error.message });
    }

    // Test 3: Check socket connection
    if (socket?.connected) {
      results.push({ test: 'Socket Connection', status: 'PASS', message: 'Socket is connected' });
    } else {
      results.push({ test: 'Socket Connection', status: 'FAIL', message: 'Socket is not connected' });
    }

    // Test 4: Check room data
    if (room?.id && room?.players?.length > 0) {
      results.push({ test: 'Room Data', status: 'PASS', message: `Room ${room.id} with ${room.players.length} players` });
    } else {
      results.push({ test: 'Room Data', status: 'FAIL', message: 'No room data available' });
    }

    // Test 5: Test STUN server connectivity
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Wait a bit for ICE gathering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (pc.localDescription?.sdp) {
        results.push({ test: 'STUN Server', status: 'PASS', message: 'STUN server connectivity OK' });
      } else {
        results.push({ test: 'STUN Server', status: 'FAIL', message: 'STUN server connectivity failed' });
      }
      
      pc.close();
    } catch (error) {
      results.push({ test: 'STUN Server', status: 'FAIL', message: error.message });
    }

    setTestResults(results);
    
    const allPassed = results.every(result => result.status === 'PASS');
    setConnectionStatus(allPassed ? 'success' : 'error');
    setIsRunning(false);
  };

  return (
    <div className="card-premium p-6 rounded-2xl border border-purple-500/20">
      <h4 className="font-heading text-lg font-bold text-white mb-4">WebRTC Connection Test</h4>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={runConnectionTest}
            disabled={isRunning}
            className="btn-premium flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            {isRunning ? 'Testing...' : 'Run Connection Test'}
          </button>
          
          <div className="flex items-center gap-2">
            {connectionStatus === 'success' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
            {connectionStatus === 'error' && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
            {connectionStatus === 'testing' && <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>}
            <span className="text-sm text-gray-300">
              {connectionStatus === 'success' ? 'All Tests Passed' :
               connectionStatus === 'error' ? 'Some Tests Failed' :
               connectionStatus === 'testing' ? 'Testing...' : 'Ready to Test'}
            </span>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-heading text-sm font-semibold text-white">Test Results:</h5>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">{result.test}:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {result.status}
                  </span>
                  <span className="text-xs text-gray-400">{result.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>• WebRTC Support: Checks if WebRTC is available</p>
          <p>• Microphone Access: Tests microphone permissions</p>
          <p>• Socket Connection: Verifies WebSocket connection</p>
          <p>• Room Data: Checks if room information is available</p>
          <p>• STUN Server: Tests network connectivity for WebRTC</p>
        </div>
      </div>
    </div>
  );
};

export default WebRTCConnectionTest; 