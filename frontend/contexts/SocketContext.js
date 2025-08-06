"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useRef, useEffect } from "react";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const eventSourceRef = useRef(null);
  const router = useRouter();

  const getBaseUrl = () => {
    let baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!baseUrl) {
      // For development, always use localhost
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        baseUrl = "http://localhost:3001";
        console.log("HTTPContext: Detected development environment, using localhost");
      } else {
        baseUrl = "https://lie-hard-backend.vercel.app";
        console.log("HTTPContext: Detected production environment, using Vercel backend");
      }
    }
    
    // Force localhost for testing
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      baseUrl = "http://localhost:3001";
    }
    
    return baseUrl;
  };

  const connectToRoom = async (playerName, roomId) => {
    console.log("HTTPContext: connectToRoom called with playerName:", playerName, "roomId:", roomId);
    
    try {
      const baseUrl = getBaseUrl();
      
      // Test connection to backend
      const testResponse = await fetch(`${baseUrl}/api/test`);
      if (!testResponse.ok) {
        throw new Error('Backend not accessible');
      }
      
      console.log("HTTPContext: Backend is accessible, connecting to room");
      
      // Join the room via HTTP
      const joinResponse = await fetch(`${baseUrl}/api/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerName
        })
      });

      if (!joinResponse.ok) {
        throw new Error('Failed to join room');
      }

      const joinData = await joinResponse.json();
      console.log("HTTPContext: Successfully joined room:", joinData);
      
      setIsConnected(true);
      setPlayer(playerName);
      setCurrentRoom(roomId);
      
      // Start listening for room updates via Server-Sent Events
      startEventStream(roomId, playerName);
      
    } catch (error) {
      console.error("HTTPContext: Error connecting to room:", error);
      setIsConnected(false);
      throw error;
    }
  };

  const startEventStream = (roomId, playerName) => {
    // Close existing event source if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = getBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/room-updates/${roomId}?playerName=${encodeURIComponent(playerName)}`);
    
    eventSource.onopen = () => {
      console.log("HTTPContext: Event stream opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("HTTPContext: Received event:", data);
        
        if (data.type === 'connected') {
          console.log("HTTPContext: Connected to room updates");
        } else if (data.type === 'ping') {
          // Keep connection alive
          console.log("HTTPContext: Ping received");
        } else if (data.playerName && data.message) {
          // Chat message received
          const newMessage = {
            id: Date.now() + Math.random(),
            player: { name: data.playerName },
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setChatMessages(prev => [...prev, newMessage]);
        } else if (data.type === 'room_update') {
          // Room state update
          setRoomData(data.roomData);
          if (data.roomData.players) {
            setRoomPlayers(data.roomData.players);
          }
        } else if (data.type === 'player_joined') {
          // New player joined
          setRoomPlayers(prev => [...prev, { id: data.playerId, name: data.playerName, score: 0 }]);
        } else if (data.type === 'player_left') {
          // Player left
          setRoomPlayers(prev => prev.filter(p => p.id !== data.playerId));
        }
      } catch (error) {
        console.error("HTTPContext: Error parsing event data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("HTTPContext: Event stream error:", error);
      // Try to reconnect after a delay
      setTimeout(() => {
        if (isConnected) {
          startEventStream(roomId, playerName);
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  const sendMessage = async (message, type = 'chat') => {
    if (!currentRoom || !player) {
      console.error("HTTPContext: Cannot send message - not connected to room");
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          playerName: player,
          message,
          type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log("HTTPContext: Message sent successfully");
      
      // Add message to local state immediately for better UX
      const newMessage = {
        id: Date.now() + Math.random(),
        player: { name: player },
        message,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error("HTTPContext: Error sending message:", error);
      throw error;
    }
  };

  const updateRoomState = async (roomData) => {
    if (!currentRoom) {
      console.error("HTTPContext: Cannot update room - not connected to room");
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: currentRoom,
          playerName: player,
          message: JSON.stringify(roomData),
          type: 'room_update'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update room state');
      }

      console.log("HTTPContext: Room state updated successfully");
      
    } catch (error) {
      console.error("HTTPContext: Error updating room state:", error);
      throw error;
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setPlayer("");
    setCurrentRoom(null);
    setRoomData(null);
    setChatMessages([]);
    setRoomPlayers([]);
    console.log("HTTPContext: Disconnected from room");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ 
        isConnected, 
        connectToRoom, 
        sendMessage, 
        updateRoomState,
        disconnect, 
        player, 
        setPlayer,
        currentRoom,
        roomData,
        chatMessages,
        roomPlayers
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
