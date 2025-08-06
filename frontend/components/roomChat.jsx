"use client";

import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";

const RoomChat = ({ roomId }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesContainerRef = useRef(null);
  const messageIdRef = useRef(0);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleMessage = ({ player, message }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${messageIdRef.current++}`,
          player,
          message,
        },
      ]);
    };
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket, roomId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;

    socket.emit("message", {
      roomId,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-indigo-300 mb-1 sm:mb-2">
        <h3 className="text-sm sm:text-lg font-semibold">Room Chat</h3>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-1 sm:mb-2 space-y-1 pr-1 rounded-bl-xl border-b-2 border-indigo-500 min-h-0"
      >
        <div className="space-y-1">
          {messages.map((msg) => {
            const isOwnMessage = msg.player.id === socket?.id;

            return (
              <div
                key={msg.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-wrap break-words overflow-wrap-anywhere ${
                    isOwnMessage
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-0.5 text-gray-600 break-words overflow-wrap-anywhere">
                      {msg.player.name}
                    </div>
                  )}
                  <div className="text-xs sm:text-sm break-words overflow-wrap-anywhere">
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-1">
        <input
          type="text"
          value={newMessage}
          autoComplete="off"
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-2 sm:px-3 py-1 sm:py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </form>
    </div>
  );
};

export default RoomChat;
