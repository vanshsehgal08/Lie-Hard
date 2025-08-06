"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useRef, useEffect } from "react";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const pollingIntervalRef = useRef(null);
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
      
      // Test connection to backend
      const testResponse = await fetch(`${baseUrl}/api/test`);
      if (!testResponse.ok) {
        throw new Error('Backend not accessible');
      }
      
      console.log("HTTPContext: Backend is accessible, connecting to room");
      
      // For now, just simulate successful connection
      setIsConnected(true);
      setPlayer(playerName);
      setCurrentRoom(roomId);
      
      console.log("HTTPContext: Successfully connected to room");
      
      // Start polling for updates
      startPolling(roomId, playerName);
      
    } catch (error) {
      console.error("HTTPContext: Error connecting to room:", error);
      setIsConnected(false);
    }
  };

  const startPolling = (roomId, playerName) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Start polling every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/test`);
        if (response.ok) {
          console.log("HTTPContext: Polling - backend is alive");
        }
      } catch (error) {
        console.error("HTTPContext: Polling error:", error);
      }
    }, 5000);
  };

  const sendMessage = async (message, type = 'message') => {
    if (!currentRoom || !player) {
      console.error("HTTPContext: Cannot send message - not connected to room");
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      // For now, just log the message since we don't have the send endpoint working
      console.log("HTTPContext: Message sent:", { roomId: currentRoom, playerName: player, message, type });
      
      // In a real implementation, this would send to the backend
      // For now, we'll just simulate success
      console.log("HTTPContext: Message sent successfully (simulated)");
    } catch (error) {
      console.error("HTTPContext: Error sending message:", error);
    }
  };

  const disconnect = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsConnected(false);
    setPlayer("");
    setCurrentRoom(null);
    console.log("HTTPContext: Disconnected from room");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
