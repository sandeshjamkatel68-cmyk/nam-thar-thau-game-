"use client";
import React, { useEffect, useState } from 'react';
import { useGame } from '../../../hooks/useGame';
import { usePlayer } from '../../../context/PlayerContext';
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';
import { SocketEvents } from 'shared/types';
import { Header } from '../../../components/layout/Header';
import { LetterPicker } from '../../../components/game/LetterPicker';
import { GameBoard } from '../../../components/game/GameBoard';
import { PlayerCard } from '../../../components/game/PlayerCard';
import { ChatBox } from '../../../components/lobby/ChatBox';
import { Button } from '../../../components/ui/Button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GamePage() {
  const { room, roundState, playerProgress } = useGame();
  const { socketId } = usePlayer();
  const { socket } = useSocket();
  const { playSound } = useSound();
  const router = useRouter();

  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!room || !roundState) {
      router.push('/');
      return;
    }
    
    // Play sounds on phase changes
    if (roundState.phase === 'picking-letter') playSound('roundStart');
    if (roundState.phase === 'stopped') playSound('stop');

  }, [room, roundState?.phase, router, playSound]);

  if (!room || !roundState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isPicker = roundState.letterPickerId === socketId;
  const isPlaying = roundState.phase === 'playing';
  const isStopped = roundState.phase === 'stopped';

  const handlePickLetter = (letter: string) => {
    socket.emit(SocketEvents.GAME_PICK_LETTER, { roomCode: room.roomCode, letter });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] relative z-10">
          
          {roundState.phase === 'picking-letter' && (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
              <h2 className="text-3xl font-heading font-bold text-white mb-2">
                Round {roundState.roundNumber}
              </h2>
              
              {isPicker ? (
                <>
                  <p className="text-text-secondary mb-8">You are the picker! Choose a letter to start the round.</p>
                  {/* The server sends letterOptions via GAME_ROUND_START, but we store it in roundState hackily for now. If not, use generic letters */}
                  <LetterPicker 
                    letters={(roundState as any).letterOptions || ['A','B','C','M','S','K']} 
                    onPick={handlePickLetter} 
                  />
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-surface-light border-4 border-surface flex items-center justify-center mb-6 shadow-xl animate-pulse">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <h3 className="text-2xl font-heading font-medium text-white mb-2">
                    Waiting for {roundState.letterPickerName}...
                  </h3>
                  <p className="text-text-secondary">They are picking a letter.</p>
                </>
              )}
            </div>
          )}

          {(isPlaying || isStopped) && (
            <div className="w-full animate-in slide-in-from-bottom-8 duration-500">
              {isStopped && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl">
                  <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                    <span className="text-6xl mb-4">🛑</span>
                    <h2 className="text-4xl font-heading font-black text-danger drop-shadow-md">ROUND STOPPED</h2>
                    <p className="text-xl text-white mt-2">
                      {roundState.stoppedBy 
                        ? `Stopped by ${(roundState as any).stoppedByName || 'a player'}` 
                        : "Time's up!"}
                    </p>
                    <p className="text-text-secondary mt-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating scores...
                    </p>
                  </div>
                </div>
              )}
              
              <GameBoard />
            </div>
          )}
        </div>

        {/* Sidebar (Players & Chat) */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-surface border border-white/5 rounded-2xl p-4 shadow-lg flex-1 overflow-y-auto max-h-[50vh] lg:max-h-none">
            <h3 className="font-heading font-semibold text-white mb-4 flex items-center justify-between">
              <span>Players</span>
              <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-secondary">Round {roundState.roundNumber}/{room.settings.maxRounds}</span>
            </h3>
            
            <div className="flex flex-col gap-2">
              {room.players.map(p => (
                <PlayerCard 
                  key={p.socketId} 
                  player={p} 
                  filledCount={playerProgress[p.socketId] || 0} 
                />
              ))}
            </div>
          </div>

          {/* Collapsible Chat for mobile, fixed for desktop */}
          <div className="hidden lg:block h-64">
            <ChatBox />
          </div>
          <div className="block lg:hidden">
            <Button variant="secondary" className="w-full" onClick={() => setShowChat(!showChat)}>
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </Button>
            {showChat && (
              <div className="h-[300px] mt-2">
                <ChatBox />
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
