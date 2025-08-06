"use client";

import { useSocket } from "@/contexts/SocketContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowRight, LogOut, Mic, MicOff, Users, MessageCircle, Settings, Copy, Crown, Timer, Trophy, Sparkles, Zap, Menu, X } from "lucide-react";
import { toast } from "sonner";
import StorySubmission from "@/components/StorySubmission";
import QuestioningPhase from "@/components/QuestioningPhase";
import VotingPhase from "@/components/VotingPhase";
import ResultsReveal from "@/components/ResultsReveal";
import GameOver from "@/components/GameOver";
import GameSettings from "@/components/GameSettings";
import WebRTCTest from "@/components/WebRTCTest";
import WebRTCStatus from "@/components/WebRTCStatus";
import WebRTCConnectionTest from "@/components/WebRTCConnectionTest";

const GamePage = () => {
  const { socket } = useSocket();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState({
    id: roomId || "",
    players: [],
    status: "WAITING",
    currentRound: 0,
    currentPlayer: null,
    hostId: "",
    votes: new Map(),
    chatHistory: []
  });
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState(["", "", ""]);
  const [isTruth, setIsTruth] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentVote, setCurrentVote] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("main"); // "main", "players", "chat"

  // Handle client-side only operations
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setShowChat(false);
      } else {
        setShowChat(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!socket || !roomId) {
      router.push("/");
      return;
    }

    socket.on("disconnect", () => {
      socket.emit("leave-room", roomId);
      return;
    });

    socket.emit("get-room-users", roomId);

    const handleRoomJoined = (room) => {
      setRoom((prev) => ({ ...prev, ...room }));
    };
    socket.on("room-joined", handleRoomJoined);

    const handleRoomUsers = ({ roomId: id, host, players }) => {
      setRoom((prev) => ({
        ...prev,
        id,
        hostId: host,
        players,
      }));
      if (host === socket.id) setIsHost(true);
      else setIsHost(false);
    };
    socket.on("room-users", handleRoomUsers);

    const handlePlayerJoined = ({ player, players }) => {
      setRoom((prev) => ({
        ...prev,
        players,
      }));
    };
    socket.on("player-joined", handlePlayerJoined);

    const handlePlayerLeft = ({ playerId, playerName, players }) => {
      toast.info(`${playerName} has left the room`);
      setRoom((prev) => ({
        ...prev,
        players: players,
      }));
    };
    socket.on("player-left", handlePlayerLeft);

    const handleGameSettingsUpdated = (room) => {
      setRoom(room);
    };
    socket.on("game-settings-updated", handleGameSettingsUpdated);

    const handleStorySubmissionStarted = (room) => {
      setRoom(room);
      toast.info("Game started! Submit your 3 stories.");
    };
    socket.on("story-submission-started", handleStorySubmissionStarted);

    const handleStoriesSubmitted = ({ playerId, room }) => {
      setRoom(room);
      if (playerId === socket.id) {
        setHasSubmitted(true);
        toast.success("Stories submitted!");
      } else {
        toast.info("A player has submitted their stories");
      }
    };
    socket.on("stories-submitted", handleStoriesSubmitted);

    const handleGameStarted = (room) => {
      setRoom(room);
      toast.success("Game started! First player is in the hot seat.");
    };
    socket.on("game-started", handleGameStarted);

    const handleTimerUpdate = ({ timeLeft, currentPlayer }) => {
      setTimeLeft(timeLeft);
      setRoom(prev => ({ ...prev, currentPlayer }));
    };
    socket.on("timer-update", handleTimerUpdate);

    const handleVotingStarted = (room) => {
      setRoom(room);
      toast.info("Time to vote! Which story do you think is true?");
    };
    socket.on("voting-started", handleVotingStarted);

    const handleVotingTimerUpdate = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };
    socket.on("voting-timer-update", handleVotingTimerUpdate);

    const handleVoteSubmitted = ({ playerId, room }) => {
      setRoom(room);
      if (playerId === socket.id) {
        toast.success("Vote submitted!");
      } else {
        toast.info("A player has voted");
      }
    };
    socket.on("vote-submitted", handleVoteSubmitted);

    const handleRevealResults = (room) => {
      setRoom(room);
      toast.success("Results revealed!");
    };
    socket.on("reveal-results", handleRevealResults);

    const handleResultTimerUpdate = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };
    socket.on("result-timer-update", handleResultTimerUpdate);

    const handleNextRound = (room) => {
      setRoom(room);
      setCurrentVote(null);
      toast.info("Next round starting...");
    };
    socket.on("next-round", handleNextRound);

    const handleGameOver = (room) => {
      setRoom(room);
      toast.success("Game over! Check the final scores.");
    };
    socket.on("game-over", handleGameOver);

    const handleGameReset = (room) => {
      setRoom(room);
      setStories(["", "", ""]);
      setIsTruth(null);
      setHasSubmitted(false);
      setCurrentVote(null);
      toast.info("Game reset! Ready for a new round.");
    };
    socket.on("game-reset", handleGameReset);

    const handleChatMessage = (message) => {
      setRoom(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, message]
      }));
    };
    socket.on("chat-message", handleChatMessage);

    const handleRoomClosed = ({ message }) => {
      toast.info(message || "Room has been closed.");
      router.push("/");
    };
    socket.on("room-closed", handleRoomClosed);

    const handleRoomError = (error) => {
      toast.error(error);
      return;
    };
    socket.on("room-error", handleRoomError);

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-users", handleRoomUsers);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("game-settings-updated", handleGameSettingsUpdated);
      socket.off("story-submission-started", handleStorySubmissionStarted);
      socket.off("stories-submitted", handleStoriesSubmitted);
      socket.off("game-started", handleGameStarted);
      socket.off("timer-update", handleTimerUpdate);
      socket.off("voting-started", handleVotingStarted);
      socket.off("voting-timer-update", handleVotingTimerUpdate);
      socket.off("vote-submitted", handleVoteSubmitted);
      socket.off("reveal-results", handleRevealResults);
      socket.off("result-timer-update", handleResultTimerUpdate);
      socket.off("next-round", handleNextRound);
      socket.off("game-over", handleGameOver);
      socket.off("game-reset", handleGameReset);
      socket.off("chat-message", handleChatMessage);
      socket.off("room-closed", handleRoomClosed);
      socket.off("room-error", handleRoomError);
      socket.off("disconnect");
    };
  }, [socket, roomId]);

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit("leave-room", roomId);
    router.push("/");
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit("start-game", roomId);
  };

  const handleResetGame = () => {
    if (!socket) return;
    socket.emit("reset-game", roomId);
  };

  const handleSubmitStories = () => {
    if (!socket) return;
    if (stories.some(story => !story.trim())) {
      toast.error("Please fill in all 3 stories");
      return;
    }
    if (isTruth === null) {
      toast.error("Please select which story is true");
      return;
    }
    socket.emit("submit-stories", { roomId, stories, isTruth });
  };

  const handleSubmitVote = () => {
    if (!socket) return;
    if (currentVote === null) {
      toast.error("Please select a story to vote for");
      return;
    }
    socket.emit("submit-vote", { roomId, guessedIndex: currentVote });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !chatMessage.trim()) return;
    socket.emit("chat-message", { roomId, message: chatMessage });
    setChatMessage("");
  };

  const copyRoomId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomId);
      toast.success("Room code copied!");
    }
  };

  const currentPlayer = room.players.find(p => p.id === room.currentPlayer);
  const isCurrentPlayer = currentPlayer?.id === socket?.id;
  const isStorySubmissionPhase = room.status === "STORY_SUBMISSION";
  const isQuestioningPhase = room.status === "QUESTIONING";
  const isVotingPhase = room.status === "VOTING";
  const isRevealPhase = room.status === "REVEAL";
  const isGameOver = room.status === "GAME_OVER";

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
                onClick={() => setShowSettings(!showSettings)}
                className="btn-premium flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Settings className="h-4 w-4" />
                <span className="font-heading font-semibold">Settings</span>
              </button>
            )}
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={`btn-premium flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                showChat 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-heading font-semibold">Chat</span>
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`btn-premium flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                isMuted 
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="font-heading font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
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
              
              {isHost && room.status === "WAITING" && (
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn-premium flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-heading font-semibold">Settings</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  setMobileMenuOpen(false);
                }}
                className={`w-full btn-premium flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isMuted 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="font-heading font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
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
                className={`card-premium p-6 rounded-2xl border transition-all duration-300 ${
                  player.id === socket?.id
                    ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-xl"
                    : player.id === room.currentPlayer
                    ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50 shadow-xl animate-pulse-glow"
                    : "bg-white/5 border-white/10 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-white text-lg">{player.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {player.id === room.hostId && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                            <Crown className="h-3 w-3 text-white" />
                            <span className="text-xs font-semibold text-white">Host</span>
                          </div>
                        )}
                        {player.id === room.currentPlayer && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                            <Timer className="h-3 w-3 text-white" />
                            <span className="text-xs font-semibold text-white">Hot Seat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Score: {player.score ?? 0}</span>
                  {player.id === room.currentPlayer && (
                    <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                      ACTIVE
                    </div>
                  )}
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
                  className={`card-premium p-4 rounded-2xl border transition-all duration-300 ${
                    player.id === socket?.id
                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-xl"
                      : player.id === room.currentPlayer
                      ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50 shadow-xl animate-pulse-glow"
                      : "bg-white/5 border-white/10 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-heading font-semibold text-white">{player.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {player.id === room.hostId && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                              <Crown className="h-3 w-3 text-white" />
                              <span className="text-xs font-semibold text-white">Host</span>
                            </div>
                          )}
                          {player.id === room.currentPlayer && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                              <Timer className="h-3 w-3 text-white" />
                              <span className="text-xs font-semibold text-white">Hot Seat</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-300 font-medium text-sm">Score: {player.score ?? 0}</span>
                      {player.id === room.currentPlayer && (
                        <div className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold animate-pulse mt-1">
                          ACTIVE
                        </div>
                      )}
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
                {room.chatHistory.map((message) => (
                  <div key={message.id} className="card-premium p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {message.player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-purple-300">{message.player.name}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-premium flex-1 px-4 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="btn-premium px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* WebRTC Test Component */}
          <WebRTCTest socket={socket} room={room} currentUserId={socket?.id} />
          
          {/* WebRTC Status Component */}
          <WebRTCStatus socket={socket} room={room} currentUserId={socket?.id} />
          
          {/* WebRTC Connection Test Component */}
          <WebRTCConnectionTest socket={socket} room={room} currentUserId={socket?.id} />
          
          {/* Main Game Content */}
          {mobileView === "main" && (
            <>
              {room.status === "WAITING" ? (
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
                  </div>
                  
                  {showSettings && (
                    <GameSettings room={room} socket={socket} isHost={isHost} />
                  )}
                  
                  {isHost && room.players.length >= 2 && (
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
              ) : room.status === "STORY_SUBMISSION" ? (
                <StorySubmission 
                  room={room} 
                  socket={socket} 
                  hasSubmitted={hasSubmitted}
                  onStoriesSubmitted={() => setHasSubmitted(true)}
                />
              ) : room.status === "QUESTIONING" ? (
                <QuestioningPhase 
                  room={room} 
                  socket={socket} 
                  isCurrentPlayer={isCurrentPlayer}
                  timeLeft={timeLeft}
                  isMuted={isMuted}
                  setIsMuted={setIsMuted}
                />
              ) : room.status === "VOTING" ? (
                <VotingPhase 
                  room={room} 
                  socket={socket} 
                  timeLeft={timeLeft}
                  currentPlayerId={socket?.id}
                />
              ) : room.status === "REVEAL" ? (
                <ResultsReveal room={room} timeLeft={timeLeft} />
              ) : room.status === "GAME_OVER" ? (
                <GameOver 
                  room={room} 
                  isHost={isHost}
                  onResetGame={handleResetGame}
                />
              ) : null}
            </>
          )}
        </main>

        {/* Right Sidebar - Chat (Desktop Only) */}
        {showChat && (
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
              {room.chatHistory.map((message) => (
                <div key={message.id} className="card-premium p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {message.player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-purple-300">{message.player.name}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{message.message}</p>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-purple-500/20">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-premium flex-1 px-4 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="btn-premium px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Send
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default GamePage;
