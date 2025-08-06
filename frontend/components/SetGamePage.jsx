import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { Users, Gamepad2, Copy, Sparkles, Crown } from "lucide-react";

const SetGamePage = ({ player }) => {
  const router = useRouter();
  const { isConnected, connectToRoom, currentRoom } = useSocket();
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    console.log("SetGamePage: connection state:", isConnected);
    console.log("SetGamePage: current room:", currentRoom);
    console.log("SetGamePage: environment variable:", process.env.NEXT_PUBLIC_SOCKET_URL);
  }, [isConnected, currentRoom]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    console.log("SetGamePage: handleJoinRoom called");
    if (!roomId.trim()) return toast.error("Please enter a room code");
    
    try {
      console.log("SetGamePage: Connecting to room:", roomId);
      await connectToRoom(player, roomId);
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error("SetGamePage: Error joining room:", error);
      toast.error("Failed to join room");
    }
  };

  const handleMakeRoom = async () => {
    console.log("SetGamePage: handleMakeRoom called");
    
    try {
      // Generate a random room ID
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log("SetGamePage: Creating room with ID:", newRoomId);
      
      await connectToRoom(player, newRoomId);
      setRoomId(newRoomId);
      router.push(`/game/${newRoomId}`);
    } catch (error) {
      console.error("SetGamePage: Error creating room:", error);
      toast.error("Failed to create room");
    }
  };

  return (
    <div className="card-premium p-8 sm:p-12 rounded-3xl max-w-lg w-full mx-4 group hover:scale-105 transition-all duration-500">
      <div className="text-center space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold gradient-premium-text">
              Welcome, {player}!
            </h3>
          </div>
          <p className="text-gray-400 font-medium">
            Ready to become the ultimate master of deception?
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Create Room Button */}
          <button
            onClick={handleMakeRoom}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Sparkles className="h-5 w-5" />
            Create New Room
          </button>

          {/* Join Room Section */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Gamepad2 className="h-5 w-5" />
              Join Room
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3 text-gray-400">
            <Users className="h-5 w-5 text-purple-500" />
            <span className="text-sm">Multiplayer</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <Copy className="h-5 w-5 text-blue-500" />
            <span className="text-sm">Easy Sharing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetGamePage;
