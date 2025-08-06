"use client";

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ChatPage = () => {
  const [socket, setSocket] = useState(null);
  const [joinName, setJoinName] = useState("");
  const [makeName, setMakeName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ message: "", sender: "" }]);
  const [currentRoom, setCurrentRoom] = useState("");

  useEffect(() => {
    const newSocket = io("http://localhost:8000/");
    newSocket.on("connect", () => {
      console.log(`User connected with socket id: ${newSocket.id}`);
      setSocket(newSocket);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("message", ({ message, sender }) => {
      setMessages((prev) => [...prev, { message, sender }]);
    });
    socket.on("room-joined", (roomName) => {
      setCurrentRoom(roomName);
      setMessages([]);
    });
  }, [socket]);

  const handleJoinRoom = () => {
    if (!socket || !joinName.trim()) return;
    socket.emit("join-room", joinName.trim());
  };

  const handleMakeRoom = () => {
    if (!socket || !makeName.trim()) return;
    socket.emit("make-room", makeName.trim());
  };

  const handleSend = () => {
    if (!socket || message.trim() === "" || !currentRoom) return;
    socket.emit("message", { room: currentRoom, message });
    setMessage("");
  };

  if (!socket)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h1 className="text-2xl">User Loading...</h1>
      </div>
    );
  return (
    <div className="min-h-screen flex flex-col gap-5 justify-center items-center">
      <h1 className="text-xl">
        User {socket.id}
        {currentRoom ? ` | Room: ${currentRoom}` : ""}
      </h1>
      <div className="flex justify-between items-center gap-2">
        <button onClick={handleJoinRoom} className="text-md">
          Join Room
        </button>
        <input
          type="text"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          className="bg-blue-200 rounded-md text-gray-800 p-1"
        />
      </div>
      <div className="flex justify-between items-center gap-2">
        <button onClick={handleMakeRoom} className="text-md">
          Make Room
        </button>
        <input
          type="text"
          value={makeName}
          onChange={(e) => setMakeName(e.target.value)}
          className="bg-blue-200 rounded-md text-gray-800 p-1"
        />
      </div>
      <div className="flex justify-between items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-blue-200 rounded-md text-gray-800 p-1"
        />
        <button onClick={handleSend} className="text-md">
          Send
        </button>
      </div>
      <div className="border border-blue-700 py-2 px-5 w-lg h-80 overflow-y-auto space-y-1">
        {messages.map((data, index) => (
          <div
            className="text-white mx-auto w-md wrap-break-word bg-purple-900 rounded-lg py-0.5 px-1"
            key={index}
          >
            {!data.message !== "" && (
              <>
                <span className="text-sm">{data.message}</span>
                <span className="text-xs ml-2 text-gray-400">
                  ({data.sender})
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
