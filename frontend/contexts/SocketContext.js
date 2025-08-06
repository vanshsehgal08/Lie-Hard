"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [player, setPlayer] = useState("");
  const router = useRouter();

  const connectSocket = (playerName) => {
    console.log("SocketContext: connectSocket called with playerName:", playerName);
    // create new socket
    if (!socket) {
      // Use environment variable for production, fallback to localhost for development
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      
      // If no environment variable is set, detect if we're in production
      if (!socketUrl) {
        if (typeof window !== 'undefined') {
          console.log("SocketContext: Window location:", window.location.href);
          console.log("SocketContext: Hostname:", window.location.hostname);
          console.log("SocketContext: Port:", window.location.port);
        }
        
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          // We're in production, use the Render backend URL
          socketUrl = "https://lie-hard.onrender.com";
          console.log("SocketContext: Detected production environment, using Render backend");
        } else {
          // We're in development, use the same hostname as the frontend
          const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
          socketUrl = `http://${hostname}:3001`;
          console.log("SocketContext: Detected development environment, using hostname:", hostname);
        }
      }
      
      console.log("SocketContext: Connecting to socket URL:", socketUrl);
      console.log("SocketContext: Environment variable NEXT_PUBLIC_SOCKET_URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
      console.log("SocketContext: Current window location:", typeof window !== 'undefined' ? window.location.href : 'server-side');
      console.log("SocketContext: Current hostname:", typeof window !== 'undefined' ? window.location.hostname : 'server-side');
      const s = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000, // Reduced timeout
        auth: { name: playerName },
        // Render-compatible settings - both polling and WebSocket
        transports: ["polling", "websocket"],
        path: "/socket.io/",
        forceNew: true,
        upgrade: true
      });

      console.log("SocketContext: Socket created, attempting to connect...");
      s.connect();
      setSocket(s);
      setPlayer(playerName);

      s.on("connect", () => {
        console.log("SocketContext: Socket connected successfully", s.id);
      });

      s.on("connect_error", (error) => {
        console.error("SocketContext: Socket connection error:", error);
        console.error("SocketContext: Error details:", {
          message: error.message,
          description: error.description,
          context: error.context
        });
        
        // Show user-friendly error message
        if (typeof window !== 'undefined') {
          toast.error("Failed to connect to server. Please check your connection and try again.");
        }
      });

      s.on("disconnect", () => {
        console.log("SocketContext: Socket disconnected", s.id);
      });

      s.on("reconnect", (attemptNumber) => {
        console.log("SocketContext: Socket reconnected after", attemptNumber, "attempts");
      });

      s.on("reconnect_error", (error) => {
        console.error("SocketContext: Socket reconnection error:", error);
      });

      s.on("reconnect_failed", () => {
        console.error("SocketContext: Socket reconnection failed");
      });
    } else {
      console.log("SocketContext: Socket already exists, not creating new one");
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, connectSocket, player, setPlayer }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
