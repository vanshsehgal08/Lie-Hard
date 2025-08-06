"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Settings, Clock, Users, Mic, MessageCircle, Play, Pause } from "lucide-react";

const GameSettings = ({ room, socket, isHost }) => {
  const [settings, setSettings] = useState({
    roundTime: room.gameSettings?.roundTime || 60,
    questionTime: room.gameSettings?.questionTime || 30,
    resultTime: room.gameSettings?.resultTime || 10,
    maxPlayers: room.gameSettings?.maxPlayers || 5,
    allowVoiceChat: room.gameSettings?.allowVoiceChat !== false,
    allowTextChat: room.gameSettings?.allowTextChat !== false,
    autoStart: room.gameSettings?.autoStart || false
  });

  const handleUpdateSettings = () => {
    if (!socket) return;
    
    // Validate settings
    if (settings.roundTime < 60 || settings.roundTime > 1200) {
      toast.error("Questioning time must be between 1-20 minutes");
      return;
    }
    
    if (settings.maxPlayers < 2 || settings.maxPlayers > 8) {
      toast.error("Max players must be between 2-8");
      return;
    }
    
    socket.emit("update-game-settings", {
      roomId: room.id,
      settings: settings
    });
    
    toast.success("Game settings updated!");
  };

  if (!isHost) return null;

  return (
    <div className="glass-premium p-8 rounded-3xl border border-purple-500/20 shadow-2xl mb-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-heading text-2xl font-bold gradient-premium-text">Room Settings</h3>
      </div>
      
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Timer Settings */}
         <div className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
               <Clock className="h-5 w-5 text-white" />
             </div>
             <h4 className="font-heading text-xl font-semibold text-white">Timer Settings</h4>
           </div>
         
           <div>
             <label className="block text-sm font-medium text-white mb-3">
               Questioning Time (1-20 minutes)
             </label>
             <div className="flex items-center gap-4">
               <input
                 type="range"
                 min="60"
                 max="1200"
                 step="30"
                 value={settings.roundTime}
                 onChange={(e) => setSettings(prev => ({ ...prev, roundTime: parseInt(e.target.value) }))}
                 className="flex-1 h-3 bg-gray-700 rounded-xl appearance-none cursor-pointer slider"
               />
               <span className="text-sm font-mono bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
                 {Math.floor(settings.roundTime / 60)}m {settings.roundTime % 60}s
               </span>
             </div>
           </div>
         
           <div>
             <label className="block text-sm font-medium text-white mb-3">
               Voting Time (seconds)
             </label>
             <input
               type="number"
               min="10"
               max="60"
               value={settings.questionTime}
               onChange={(e) => setSettings(prev => ({ ...prev, questionTime: parseInt(e.target.value) }))}
               className="input-premium w-full px-4 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-white mb-3">
               Result Display Time (seconds)
             </label>
             <input
               type="number"
               min="5"
               max="30"
               value={settings.resultTime}
               onChange={(e) => setSettings(prev => ({ ...prev, resultTime: parseInt(e.target.value) }))}
               className="input-premium w-full px-4 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
           </div>
         </div>

        {/* Room Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-heading text-xl font-semibold text-white">Room Settings</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Max Players (2-8)
            </label>
            <input
              type="number"
              min="2"
              max="8"
              value={settings.maxPlayers}
              onChange={(e) => setSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
              className="input-premium w-full px-4 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
                      <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Voice Chat</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, allowVoiceChat: !prev.allowVoiceChat }))}
                  className={`toggle-premium ${settings.allowVoiceChat ? 'active' : ''}`}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-medium text-white">Text Chat</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, allowTextChat: !prev.allowTextChat }))}
                  className={`toggle-premium ${settings.allowTextChat ? 'active' : ''}`}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-white">Auto Start</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                  className={`toggle-premium ${settings.autoStart ? 'active' : ''}`}
                />
              </div>
            </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/10">
        <button
          onClick={handleUpdateSettings}
          className="btn-premium w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-4 px-8 rounded-xl font-heading font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          Update Settings
        </button>
      </div>
    </div>
  );
};

export default GameSettings; 