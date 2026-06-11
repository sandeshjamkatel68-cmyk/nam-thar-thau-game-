"use client";
import React, { useEffect } from 'react';
import { useGame } from '../../../hooks/useGame';
import { usePlayer } from '../../../context/PlayerContext';
import { useSocket } from '../../../hooks/useSocket';
import { SocketEvents } from 'shared/types';
import { PlayerList } from '../../../components/lobby/PlayerList';
import { ChatBox } from '../../../components/lobby/ChatBox';
import { RoomSettings } from '../../../components/lobby/RoomSettings';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Header } from '../../../components/layout/Header';
import { Play, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearRoomSession } from '../../../lib/session';

export default function LobbyPage() {
  const { room, error } = useGame();
  const { socketId } = usePlayer();
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (error || !room) {
      // If we're here without a room, go home
      const timeout = setTimeout(() => {
        if (!room) router.push('/');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [room, error, router]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isHost = room.hostPlayerId === socketId;
  const canStart = isHost && room.players.length >= 2;

  const handleStartGame = () => {
    if (!canStart) return;
    socket.emit(SocketEvents.GAME_START, { roomCode: room.roomCode });
  };

  const handleLeave = () => {
    socket.emit(SocketEvents.ROOM_LEAVE, { roomCode: room.roomCode });
    clearRoomSession();
    router.push('/');
  };

  const handleKick = (targetId: string) => {
    socket.emit(SocketEvents.ROOM_KICK, { roomCode: room.roomCode, targetPlayerId: targetId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">Game Lobby</h1>
            <p className="text-text-secondary mt-1">Waiting for players to join...</p>
          </div>
          
          <Button variant="ghost" onClick={handleLeave} className="text-danger hover:bg-danger/10 hover:text-danger">
            <LogOut className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* Left Column: Players & Settings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <Card padding="md" className="flex-1 flex flex-col border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <h2 className="text-xl font-heading font-semibold text-white">Players</h2>
                <span className="text-sm text-text-secondary font-medium">
                  {room.players.length} / {room.settings.maxPlayers}
                </span>
              </div>
              
              <PlayerList 
                players={room.players} 
                hostId={room.hostPlayerId} 
                isHost={isHost} 
                onKick={handleKick} 
              />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RoomSettings 
                roomCode={room.roomCode} 
                settings={room.settings} 
                isHost={isHost} 
              />
              
              <Card className="flex flex-col items-center justify-center text-center gap-4 bg-surface-light/20">
                <h3 className="text-lg font-heading font-medium text-white">Ready to play?</h3>
                
                {isHost ? (
                  <Button 
                    size="lg" 
                    onClick={handleStartGame} 
                    disabled={!canStart}
                    className="w-full max-w-xs"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Start Game
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-accent">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-medium">Waiting for host to start...</span>
                  </div>
                )}
                
                {isHost && room.players.length < 2 && (
                  <p className="text-xs text-danger mt-2">Need at least 2 players to start</p>
                )}
              </Card>
            </div>
            
          </div>

          {/* Right Column: Chat */}
          <div className="h-[500px] lg:h-auto">
            <ChatBox />
          </div>

        </div>
      </main>
    </div>
  );
}
