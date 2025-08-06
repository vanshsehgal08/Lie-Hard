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
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    console.log("SetGamePage: socket state:", socket);
    console.log("SetGamePage: socket connected:", socket?.connected);
    console.log("SetGamePage: environment variable:", process.env.NEXT_PUBLIC_SOCKET_URL);
    
    if (!socket) {
      console.log("SetGamePage: No socket available");
      return;
    }

    const handlePlayerJoined = ({ roomId, player, players }) => {
      console.log("SetGamePage: player-joined event received:", { roomId, player, players });
      if (player.id === socket.id) {
        router.push(`/game/${roomId}`);
      }
    };
    socket.on("player-joined", handlePlayerJoined);

    const handleRoomError = (error) => {
      console.log("SetGamePage: room-error event received:", error);
      toast.error(error);
      return;
    };
    socket.on("room-error", handleRoomError);

    return () => {
      socket.off("room-error", handleRoomError);
      socket.off("player-joined", handlePlayerJoined);
    };
  }, [socket]);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    console.log("SetGamePage: handleJoinRoom called");
    if (!socket) {
      console.log("SetGamePage: Socket not connected");
      return toast.error("Socket not connected");
    }
    if (!roomId.trim()) return toast.error("Please enter a room code");
    
    if (!socket.connected) {
      console.log("SetGamePage: Socket not connected, waiting for connection...");
      setIsConnecting(true);
      toast.info("Connecting to server...");
      
      // Wait for socket to connect
      socket.once("connect", () => {
        console.log("SetGamePage: Socket connected, now emitting join-room");
        setIsConnecting(false);
        socket.emit("join-room", roomId);
      });
      
      return;
    }
    
    console.log("SetGamePage: Emitting join-room with roomId:", roomId);
    socket.emit("join-room", roomId);
  };

  const handleMakeRoom = () => {
    console.log("SetGamePage: handleMakeRoom called");
    console.log("SetGamePage: Socket state:", socket);
    console.log("SetGamePage: Socket connected:", socket?.connected);
    
    if (!socket) {
      console.log("SetGamePage: Socket not connected");
      return toast.error("Socket not connected");
    }
    
    if (!socket.connected) {
      console.log("SetGamePage: Socket not connected, waiting for connection...");
      setIsConnecting(true);
      toast.info("Connecting to server...");
      
      // Wait for socket to connect
      socket.once("connect", () => {
        console.log("SetGamePage: Socket connected, now emitting make-room");
        setIsConnecting(false);
        socket.emit("make-room", {}, (roomId) => {
          console.log("SetGamePage: make-room callback received roomId:", roomId);
          if (roomId) {
            setRoomId(roomId);
            router.push(`/game/${roomId}`);
          } else {
            console.log("SetGamePage: No roomId received from make-room");
          }
        });
      });
      
      // Also handle connection timeout
      setTimeout(() => {
        if (!socket.connected) {
          console.log("SetGamePage: Connection timeout");
          setIsConnecting(false);
          toast.error("Connection timeout. Please try again.");
        }
      }, 10000);
      
      return;
    }
    
    console.log("SetGamePage: Emitting make-room");
    socket.emit("make-room", {}, (roomId) => {
      console.log("SetGamePage: make-room callback received roomId:", roomId);
      if (roomId) {
        setRoomId(roomId);
        router.push(`/game/${roomId}`);
      } else {
        console.log("SetGamePage: No roomId received from make-room");
      }
    });
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

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Join Room */}
          <Dialog>
            <DialogTrigger className="w-full">
              <div className="btn-premium w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-heading font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-center gap-3">
                  <Users className="h-5 w-5" />
                  <span>Join Existing Room</span>
                  <Sparkles className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="glass-premium border border-purple-500/20">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl font-bold gradient-premium-text">
                  Join a Room
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Enter the room code provided by your friend
                </DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={handleJoinRoom}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gamepad2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    autoFocus
                    placeholder="Enter room code"
                    className="input-premium w-full pl-12 pr-4 py-4 text-lg font-medium text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    maxLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!roomId.trim() || isConnecting}
                  className="btn-premium w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-heading font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isConnecting ? "Connecting..." : "Join Room"}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Room */}
          <button
            onClick={handleMakeRoom}
            disabled={isConnecting}
            className="btn-premium w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white font-heading font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center justify-center gap-3">
              <Gamepad2 className="h-5 w-5" />
              <span>{isConnecting ? "Connecting..." : "Create New Room"}</span>
              <Sparkles className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Premium Features */}
        <div className="pt-6 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="font-medium">Premium Multiplayer Experience</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetGamePage;
