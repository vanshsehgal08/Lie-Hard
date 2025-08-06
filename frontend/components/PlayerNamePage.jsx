import { useSocket } from "@/contexts/SocketContext";
import React, { useState } from "react";
import { User, Sparkles, ArrowRight } from "lucide-react";

const PlayerNamePage = () => {
  const [name, setName] = useState("");
  const { connectSocket } = useSocket();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    connectSocket(name);
  };

  return (
    <div className="card-premium p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 group hover:scale-105 transition-all duration-500">
      <div className="text-center space-y-6">
        {/* Premium Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
            <User className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="font-heading text-2xl sm:text-3xl font-bold gradient-premium-text">
            Enter Your Name
          </h3>
          <p className="text-gray-400 font-medium">
            Choose your identity for the ultimate bluffing experience
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Your name"
              className="input-premium w-full pl-12 pr-4 py-4 text-lg font-medium text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-premium w-full py-4 px-8 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-heading font-semibold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-3">
              <span>Start Adventure</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          </button>
        </form>

        {/* Premium Features Preview */}
        <div className="pt-6 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="font-medium">Premium Experience</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerNamePage;
