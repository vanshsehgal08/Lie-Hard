"use client";

import { useSocket } from "@/contexts/SocketContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowRight, LogOut, Mic, MicOff, Users, MessageCircle, Settings, Copy, Crown, Timer, Trophy, Sparkles, Zap, Menu, X } from "lucide-react";
import { toast } from "sonner";

const GamePage = () => {
  const { isConnected, player, currentRoom } = useSocket();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState({
    id: roomId || "",
    players: [
      { id: "1", name: player || "Player", score: 0 }
    ],
    status: "WAITING",
    currentRound: 0,
    currentPlayer: null,
    hostId: "1",
    votes: new Map(),
    chatHistory: []
  });
  const [isHost, setIsHost] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("main"); // "main", "players", "chat"
  const [isClient, setIsClient] = useState(false);

  // Handle client-side only operations
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        // Mobile view adjustments
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isConnected || !roomId) {
      router.push("/");
      return;
    }

    // For now, simulate a working room
    console.log("Game page loaded with room:", roomId);
    toast.success("Connected to room!");
  }, [isConnected, roomId, router]);

  const handleLeaveRoom = () => {
    toast.info("Leaving room...");
    router.push("/");
  };

  const handleStartGame = () => {
    toast.info("Game start functionality coming soon!");
  };

  const handleResetGame = () => {
    toast.info("Game reset functionality coming soon!");
  };

  const copyRoomId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomId);
      toast.success("Room code copied!");
    }
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-xl font-semibold text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Premium Header */}
      <header className="w-full py-6 px-8 glass-premium border-b border-purple-500/20 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black gradient-premium-text">
              Lie Hard
            </h1>
            <p className="text-gray-400 text-sm font-medium">Premium Bluffing Game</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden btn-premium flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="font-heading font-semibold">Menu</span>
          </button>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-4">
            {isHost && room.status === "WAITING" && (
              <button
                onClick={() => toast.info("Settings coming soon!")}
                className="btn-premium flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Settings className="h-4 w-4" />
                <span className="font-heading font-semibold">Settings</span>
              </button>
            )}
            
            <button
              onClick={() => toast.info("Chat coming soon!")}
              className="btn-premium flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-heading font-semibold">Chat</span>
            </button>
            
            <button
              onClick={() => toast.info("Voice chat coming soon!")}
              className="btn-premium flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MicOff className="h-4 w-4" />
              <span className="font-heading font-semibold">Muted</span>
            </button>
          </div>
          
          <button
            onClick={handleLeaveRoom}
            className="btn-premium flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-heading font-semibold">Leave</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-20 right-4 w-64 glass-premium rounded-2xl border border-purple-500/20 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-white">Quick Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setMobileView("players");
                  setMobileMenuOpen(false);
                }}
                className="w-full btn-premium flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="font-heading font-semibold">Players</span>
              </button>
              
              <button
                onClick={() => {
                  setMobileView("chat");
                  setMobileMenuOpen(false);
                }}
                className="w-full btn-premium flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-heading font-semibold">Chat</span>
              </button>
              
              <div className="pt-3 border-t border-purple-500/20">
                <button
                  onClick={copyRoomId}
                  className="w-full btn-premium flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  <Copy className="h-4 w-4" />
                  <span className="font-heading font-semibold">Copy Room Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        {/* Left Sidebar - Players (Desktop Only) */}
        <aside className="hidden lg:flex w-80 glass-premium border-r border-purple-500/20 flex-col">
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">Players</h3>
              </div>
              <button
                onClick={copyRoomId}
                className="btn-premium flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
              >
                <Copy className="h-3 w-3" />
                Copy ID
              </button>
            </div>
            <div className="text-center">
              <span className="text-2xl font-mono bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl border border-purple-500/20 shadow-lg">
                {roomId}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="card-premium p-6 rounded-2xl border bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-white text-lg">{player.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                          <Crown className="h-3 w-3 text-white" />
                          <span className="text-xs font-semibold text-white">Host</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Score: {player.score ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView("main")}
                className={`px-4 py-2 rounded-lg font-heading font-semibold transition-all duration-200 ${
                  mobileView === "main" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                Game
              </button>
              <button
                onClick={() => setMobileView("players")}
                className={`px-4 py-2 rounded-lg font-heading font-semibold transition-all duration-200 ${
                  mobileView === "players" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                Players
              </button>
              <button
                onClick={() => setMobileView("chat")}
                className={`px-4 py-2 rounded-lg font-heading font-semibold transition-all duration-200 ${
                  mobileView === "chat" 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" 
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                Chat
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-lg font-mono bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg border border-purple-500/20">
                {roomId}
              </span>
            </div>
          </div>

          {/* Mobile Players View */}
          {mobileView === "players" && (
            <div className="lg:hidden space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">Players ({room.players.length})</h3>
              </div>
              
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="card-premium p-4 rounded-2xl border bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-heading font-semibold text-white">{player.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                            <Crown className="h-3 w-3 text-white" />
                            <span className="text-xs font-semibold text-white">Host</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-300 font-medium text-sm">Score: {player.score ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile Chat View */}
          {mobileView === "chat" && (
            <div className="lg:hidden flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">Chat</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                <div className="card-premium p-3 rounded-xl">
                  <p className="text-gray-300 text-sm">Chat functionality coming soon!</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Game Content */}
          {mobileView === "main" && (
            <div className="flex flex-col items-center justify-center h-full gap-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="font-display text-4xl font-black gradient-premium-text">Waiting for Players</h2>
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow" style={{animationDelay: '1s'}}>
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>
                <p className="font-heading text-xl text-gray-300 max-w-2xl leading-relaxed">
                  Share the room code with friends to start the ultimate bluffing experience!
                </p>
                <p className="text-gray-400 text-sm">
                  Full multiplayer functionality coming soon!
                </p>
              </div>
              
              {isHost && room.players.length >= 1 && (
                <button
                  onClick={handleStartGame}
                  className="btn-premium px-12 py-6 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white rounded-2xl font-heading font-bold text-xl hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6" />
                    <span>Start Game</span>
                    <Sparkles className="h-5 w-5" />
                  </div>
                </button>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar - Chat (Desktop Only) */}
        <aside className="hidden lg:flex w-80 glass-premium border-l border-purple-500/20 flex-col">
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">Chat</h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="card-premium p-3 rounded-xl">
              <p className="text-gray-300 text-sm">Chat functionality coming soon!</p>
            </div>
          </div>
          
          <div className="p-6 border-t border-purple-500/20">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Chat coming soon..."
                disabled
                className="input-premium flex-1 px-4 py-3 text-gray-400 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                disabled
                className="btn-premium px-6 py-3 bg-gray-600 text-gray-400 rounded-xl cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GamePage;
