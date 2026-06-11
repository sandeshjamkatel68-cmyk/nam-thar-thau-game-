"use client";
import React from 'react';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { useSocket } from '../../hooks/useSocket';
import { Volume2, VolumeX, Copy, CheckCircle2, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { room } = useGame();
  const { isMuted, toggleMute } = useSound();
  const { isConnected } = useSocket();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full bg-surface/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo/Title */}
        <Link href="/" className="flex flex-col hover:opacity-80 transition-opacity">
          <span className="font-heading font-bold text-xl text-gradient tracking-wide">
            Nam Thar Thau
          </span>
        </Link>

        {/* Room Info (if in room) */}
        {room && (
          <div className="flex items-center gap-6">
            <div 
              onClick={handleCopy}
              className="hidden sm:flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all group"
              title="Copy Room Code"
            >
              <span className="text-xs text-text-secondary uppercase">Room</span>
              <span className="font-mono font-bold tracking-widest text-white">{room.roomCode}</span>
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-text-secondary group-hover:text-white" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-text-secondary bg-surface-light px-3 py-1.5 rounded-lg border border-white/5">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">{room.players.length}/{room.settings.maxPlayers}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-danger"
            )} title={isConnected ? "Connected" : "Disconnected"} />
            <span className="text-xs text-text-secondary hidden sm:inline-block">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
          
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-surface-light text-text-secondary hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
