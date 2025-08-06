"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useRef } from "react";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const eventSourceRef = useRef(null);
  const router = useRouter();

  const getBaseUrl = () => {
    let baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!baseUrl) {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        baseUrl = "https://lie-hard-backend.vercel.app";
        console.log("HTTPContext: Detected production environment, using Vercel backend");
      } else {
        baseUrl = "http://localhost:3001";
        console.log("HTTPContext: Detected development environment, using localhost");
      }
    }
    
    return baseUrl;
  };

  const connectToRoom = async (playerName, roomId) => {
    console.log("HTTPContext: connectToRoom called with playerName:", playerName, "roomId:", roomId);
    
    try {
      const baseUrl = getBaseUrl();
      
      // Join the room
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

      console.log("HTTPContext: Successfully joined room");

      // Set up Server-Sent Events connection
      const eventSource = new EventSource(`${baseUrl}/api/room-updates/${roomId}?playerName=${encodeURIComponent(playerName)}`);
      
      eventSource.onopen = () => {
        console.log("HTTPContext: SSE connection opened");
        setIsConnected(true);
        setPlayer(playerName);
        setCurrentRoom(roomId);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("HTTPContext: Received message:", data);
          
          // Handle different message types
          if (data.type === 'connected') {
            console.log("HTTPContext: Connected to room updates");
          } else if (data.type === 'ping') {
            // Keep connection alive
            console.log("HTTPContext: Received ping");
          } else {
            // Handle game-specific messages
            console.log("HTTPContext: Game message received:", data);
          }
        } catch (error) {
          console.error("HTTPContext: Error parsing message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("HTTPContext: SSE connection error:", error);
        setIsConnected(false);
      };

      eventSourceRef.current = eventSource;
      
    } catch (error) {
      console.error("HTTPContext: Error connecting to room:", error);
      setIsConnected(false);
    }
  };

  const sendMessage = async (message, type = 'message') => {
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
    } catch (error) {
      console.error("HTTPContext: Error sending message:", error);
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
    console.log("HTTPContext: Disconnected from room");
  };

  return (
    <SocketContext.Provider
      value={{ 
        isConnected, 
        connectToRoom, 
        sendMessage, 
        disconnect, 
        player, 
        setPlayer,
        currentRoom 
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
