import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useWebRTC = (socket, roomId, players, currentUserId) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const remoteAudioRefsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const isInitializingRef = useRef(false);

  // Initialize WebRTC
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleWebRTCSignal = ({ fromId, signal }) => {
      handleIncomingSignal({ fromId, signal });
    };

    socket.on("webrtc-signal", handleWebRTCSignal);

    // Initialize audio when component mounts
    if (!isInitializingRef.current) {
      initializeAudio();
    }

    return () => {
      socket.off("webrtc-signal", handleWebRTCSignal);
      cleanupAudio();
    };
  }, [socket, roomId, players]);

  // Initialize audio stream
  const initializeAudio = async () => {
    if (isInitializingRef.current) {
      console.log('Audio initialization already in progress');
      return;
    }

    isInitializingRef.current = true;
    
    try {
      console.log('Initializing audio stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsAudioEnabled(true);
      console.log('Audio stream initialized successfully');
      
      // Create peer connections for all other players
      players.forEach(player => {
        if (player.id !== currentUserId) {
          createPeerConnection(player.id);
        }
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    } finally {
      isInitializingRef.current = false;
    }
  };

  // Create peer connection for a specific player
  const createPeerConnection = (playerId) => {
    // Don't create if already exists
    if (peerConnectionsRef.current.has(playerId)) {
      console.log(`Peer connection for ${playerId} already exists`);
      return;
    }

    console.log(`Creating new peer connection for ${playerId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log(`Received track from ${playerId}`);
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => new Map(prev.set(playerId, remoteStream)));
      
      // Create audio element for remote stream
      const audioElement = document.createElement('audio');
      audioElement.srcObject = remoteStream;
      audioElement.autoplay = true;
      audioElement.volume = 0.5;
      audioElement.muted = !isListening;
      remoteAudioRefsRef.current.set(playerId, audioElement);
      document.body.appendChild(audioElement);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${playerId}`);
        socket.emit("webrtc-signal", {
          roomId,
          targetId: playerId,
          signal: {
            type: 'candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${playerId}:`, peerConnection.connectionState);
      
      // Cleanup if connection failed or closed
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        console.log(`Cleaning up failed/closed connection with ${playerId}`);
        peerConnectionsRef.current.delete(playerId);
        pendingCandidatesRef.current.delete(playerId);
        
        // Remove audio element
        const audioElement = remoteAudioRefsRef.current.get(playerId);
        if (audioElement && audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
        remoteAudioRefsRef.current.delete(playerId);
        
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(playerId);
          return newMap;
        });
      }
    };

    peerConnectionsRef.current.set(playerId, peerConnection);
    pendingCandidatesRef.current.set(playerId, []);

    // Create and send offer
    createOffer(playerId);
  };

  // Create offer for a peer connection
  const createOffer = async (playerId) => {
    const peerConnection = peerConnectionsRef.current.get(playerId);
    if (!peerConnection) return;

    try {
      console.log(`Creating offer for ${playerId}`);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log(`Set local description for ${playerId}`);
      
      socket.emit("webrtc-signal", {
        roomId,
        targetId: playerId,
        signal: {
          type: 'offer',
          sdp: peerConnection.localDescription
        }
      });
      console.log(`Sent offer to ${playerId}`);
    } catch (error) {
      console.error(`Error creating offer for ${playerId}:`, error);
    }
  };

  // Handle incoming WebRTC signals
  const handleIncomingSignal = async ({ fromId, signal }) => {
    console.log(`Received signal from ${fromId}:`, signal.type);
    
    let peerConnection = peerConnectionsRef.current.get(fromId);
    
    if (!peerConnection) {
      console.log(`Creating new peer connection for ${fromId}`);
      // Create new peer connection for this player
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log(`Received track from ${fromId}`);
        const remoteStream = event.streams[0];
        setRemoteStreams(prev => new Map(prev.set(fromId, remoteStream)));
        
        // Create audio element for remote stream
        const audioElement = document.createElement('audio');
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        audioElement.volume = 0.5;
        audioElement.muted = !isListening;
        remoteAudioRefsRef.current.set(fromId, audioElement);
        document.body.appendChild(audioElement);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Sending ICE candidate to ${fromId}`);
          socket.emit("webrtc-signal", {
            roomId,
            targetId: fromId,
            signal: {
              type: 'candidate',
              candidate: event.candidate
            }
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${fromId}:`, peerConnection.connectionState);
      };

      peerConnectionsRef.current.set(fromId, peerConnection);
      pendingCandidatesRef.current.set(fromId, []);
    }

    try {
      if (signal.type === 'offer') {
        console.log(`Processing offer from ${fromId}`);
        
        // Check if we already have a remote description
        if (peerConnection.remoteDescription) {
          console.log(`Already have remote description for ${fromId}, ignoring offer`);
          return;
        }
        
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        console.log(`Set remote description for ${fromId}`);
        
        // Add any pending candidates
        const pendingCandidates = pendingCandidatesRef.current.get(fromId) || [];
        console.log(`Adding ${pendingCandidates.length} pending candidates for ${fromId}`);
        for (const candidate of pendingCandidates) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Error adding pending candidate:", error);
          }
        }
        pendingCandidatesRef.current.set(fromId, []);
        
        // Create and send answer
        console.log(`Creating answer for ${fromId}`);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log(`Sending answer to ${fromId}`);
        
        socket.emit("webrtc-signal", {
          roomId,
          targetId: fromId,
          signal: {
            type: 'answer',
            sdp: peerConnection.localDescription
          }
        });
      } else if (signal.type === 'answer') {
        console.log(`Processing answer from ${fromId}`);
        
        // Check if we already have a remote description
        if (peerConnection.remoteDescription) {
          console.log(`Already have remote description for ${fromId}, ignoring answer`);
          return;
        }
        
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        console.log(`Set remote description for ${fromId}`);
        
        // Add any pending candidates
        const pendingCandidates = pendingCandidatesRef.current.get(fromId) || [];
        console.log(`Adding ${pendingCandidates.length} pending candidates for ${fromId}`);
        for (const candidate of pendingCandidates) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Error adding pending candidate:", error);
          }
        }
        pendingCandidatesRef.current.set(fromId, []);
      } else if (signal.type === 'candidate') {
        console.log(`Processing ICE candidate from ${fromId}`);
        // Add ICE candidate
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            console.log(`Added ICE candidate for ${fromId}`);
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        } else {
          // Store candidate for later
          console.log(`Storing ICE candidate for ${fromId} (no remote description yet)`);
          const pendingCandidates = pendingCandidatesRef.current.get(fromId) || [];
          pendingCandidates.push(signal.candidate);
          pendingCandidatesRef.current.set(fromId, pendingCandidates);
        }
      }
    } catch (error) {
      console.error(`Error handling signal from ${fromId}:`, error);
    }
  };

  // Cleanup audio
  const cleanupAudio = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connections
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Remove remote audio elements
    remoteAudioRefsRef.current.forEach(audioElement => {
      if (audioElement && audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement);
      }
    });
    remoteAudioRefsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams(new Map());
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  };

  // Toggle listening
  const toggleListening = () => {
    const newListeningState = !isListening;
    setIsListening(newListeningState);
    
    remoteAudioRefsRef.current.forEach(audioElement => {
      if (audioElement) {
        audioElement.muted = !newListeningState;
      }
    });
  };

  return {
    isAudioEnabled,
    isListening,
    remoteStreams,
    toggleMute,
    toggleListening,
    cleanupAudio
  };
}; 