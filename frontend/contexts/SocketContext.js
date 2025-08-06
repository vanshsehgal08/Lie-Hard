"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [player, setPlayer] = useState("");
  const router = useRouter();

  const connectSocket = (playerName) => {
    // create new socket
    if (!socket) {
      // Use environment variable for production, fallback to localhost for development
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      console.log("Connecting to socket URL:", socketUrl);
      console.log("Environment variable NEXT_PUBLIC_SOCKET_URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
      const s = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: { name: playerName },
      });

      s.connect();
      setSocket(s);
      setPlayer(playerName);

      s.on("connect", () => {
        console.log("Socket connected", s.id);
      });

      s.on("disconnect", () => {
        console.log("Socket disconnected", s.id);
      });

      s.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
      });
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
