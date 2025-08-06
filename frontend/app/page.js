"use client";

import PlayerNamePage from "@/components/PlayerNamePage";
import SetGamePage from "@/components/SetGamePage";
import { useSocket } from "@/contexts/SocketContext";
import { Info, Sparkles, Users, Trophy, Zap } from "lucide-react";
import React, { useState } from "react";

const Home = () => {
  const { player } = useSocket();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(156, 146, 172, 0.1) 0%, transparent 50%)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-cyan-400 rounded-full animate-float opacity-50" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-pink-400 rounded-full animate-float opacity-30" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 pt-20 flex flex-col justify-center items-center sm:gap-12 gap-8 px-4">
        {/* Premium Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-6xl sm:text-8xl font-black gradient-premium-text text-shadow-premium">
              Lie Hard
            </h1>
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow" style={{animationDelay: '1s'}}>
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <p className="font-heading text-xl sm:text-2xl text-gray-300 max-w-3xl leading-relaxed">
            Experience the ultimate social bluffing game with premium graphics and real-time multiplayer action. 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold"> 
              Deceive, question, and triumph!
            </span>
          </p>
        </div>

        {/* Player Name/Set Game Page */}
        <div className="w-full flex justify-center">
          {player === "" ? <PlayerNamePage /> : <SetGamePage player={player} />}
        </div>

        {/* Premium Feature Cards */}
        <div className="px-4 w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* How to Play Card */}
            <div className="card-premium p-8 rounded-2xl group hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-white">
                  How to Play
                </h2>
              </div>
              <ul className="space-y-3 text-gray-300 font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Enter your name to get started</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Create a room or join with a code</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Submit 3 stories (2 lies, 1 truth)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Take turns in the "hot seat"</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Vote and score points!</span>
                </li>
              </ul>
            </div>

            {/* Game Rules Card */}
            <div className="card-premium p-8 rounded-2xl group hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-white">
                  Scoring System
                </h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    +1
                  </div>
                  <span className="font-medium">Point for each person you fool</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    +1
                  </div>
                  <span className="font-medium">Point for guessing correctly</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    +2
                  </div>
                  <span className="font-medium">Bonus if no one guesses your truth</span>
                </div>
              </div>
            </div>

            {/* Features Card */}
            <div className="card-premium p-8 rounded-2xl group hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-white">
                  Premium Features
                </h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="font-medium">Real-time voice & text chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="font-medium">Customizable game timers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="font-medium">Advanced room settings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="font-medium">Live score tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="font-medium">Premium UI/UX design</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Warning */}
        <div className="w-full max-w-2xl mb-8">
          <div className="glass-premium p-6 rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-lg font-semibold text-white">Server Notice</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              This premium experience is hosted on a high-performance server. You may experience brief loading times during peak hours. 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-semibold"> 
                Thank you for your patience!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
