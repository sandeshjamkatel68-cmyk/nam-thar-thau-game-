"use client";
import React, { useEffect, useState } from 'react';
import { useGame } from '../../../hooks/useGame';
import { usePlayer } from '../../../context/PlayerContext';
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';
import { Category, SocketEvents } from 'shared/types';
import { Header } from '../../../components/layout/Header';
import { RoundResults } from '../../../components/game/RoundResults';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Trophy, Crown, ArrowRight, Play, Loader2, Home, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { clearRoomSession } from '../../../lib/session';

export default function ResultsPage() {
  const { room, roundState, leaderboard, finalResults, reviewOverrides, rejoining } = useGame();
  const { socketId } = usePlayer();
  const { socket } = useSocket();
  const { playSound } = useSound();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFinal = searchParams.get('final') === 'true';

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (rejoining) return;

    if (!room) {
      router.push('/');
      return;
    }

    if (isFinal && finalResults) {
      playSound('winner');
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [room, isFinal, finalResults, rejoining, router, playSound]);

  if (rejoining || !room || (!roundState && !isFinal)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isHost = room.hostPlayerId === socketId;
  const isReviewing = roundState?.phase === 'reviewing';
  const currentLeaderboard = isFinal ? finalResults?.finalLeaderboard || leaderboard : leaderboard;

  const handleNextRound = () => {
    if (!isHost) return;
    socket.emit(SocketEvents.GAME_NEXT_ROUND, { roomCode: room.roomCode });
  };

  const handleToggleReview = (playerId: string, category: Category) => {
    if (!isHost || !isReviewing) return;
    socket.emit(SocketEvents.GAME_REVIEW_TOGGLE, { roomCode: room.roomCode, playerId, category });
  };

  const handleConfirmReview = () => {
    if (!isHost) return;
    socket.emit(SocketEvents.GAME_REVIEW_CONFIRM, { roomCode: room.roomCode });
  };

  const handleGoHome = () => {
    socket.emit(SocketEvents.ROOM_LEAVE, { roomCode: room.roomCode });
    clearRoomSession();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i}
              className="absolute w-3 h-3 rounded-sm animate-fall"
              style={{
                backgroundColor: ['#E11D48', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 4)],
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
        
        {/* Left Column: Round Results (hidden if final) */}
        {!isFinal && roundState && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
                  Round {roundState.roundNumber} {isReviewing ? 'Review' : 'Results'}
                  <span className="text-xl px-3 py-1 bg-surface-light rounded-lg border border-white/10 text-primary uppercase font-black">
                    Letter: {roundState.letter}
                  </span>
                </h1>
                <p className="text-text-secondary mt-1">
                  {isReviewing
                    ? (isHost ? 'Tap any answer to mark it invalid before scores are finalized' : 'Host is verifying answers...')
                    : `Stopped by: ${(roundState as any).stoppedByName || 'Timer'}`}
                </p>
              </div>
            </div>

            <div className="bg-surface border border-white/5 rounded-2xl shadow-xl overflow-hidden">
              <RoundResults
                results={roundState.results}
                interactive={isHost && isReviewing}
                overrides={reviewOverrides}
                onToggle={handleToggleReview}
              />
            </div>
          </div>
        )}

        {/* Final Winner Celebration */}
        {isFinal && finalResults && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Crown className="w-24 h-24 text-accent mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-bounce" />
            <h1 className="text-5xl font-heading font-black text-white mb-2">Tournament Complete!</h1>
            <p className="text-xl text-text-secondary mb-12">Congratulations to the winner</p>
            
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
              <div className="relative bg-surface border border-accent/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <Avatar name={finalResults.winner.playerName} color={finalResults.winner.avatarColor} size="lg" className="w-24 h-24 text-4xl mb-4 border-4 border-accent" />
                <h2 className="text-3xl font-bold text-white mb-1">{finalResults.winner.playerName}</h2>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-secondary">Score</span>
                    <span className="text-2xl font-bold text-accent">{finalResults.winner.totalScore}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-secondary">Won</span>
                    <span className="text-2xl font-bold text-success">{finalResults.winner.roundsWon} Rnds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Leaderboard & Controls */}
        <div className="w-full xl:w-96 flex flex-col gap-6">
          <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl flex-1">
            <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              Leaderboard
            </h2>
            
            <div className="flex flex-col gap-3">
              {currentLeaderboard.map((entry, idx) => (
                <div 
                  key={entry.playerId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    entry.playerId === socketId ? "bg-primary/10 border-primary/30" : "bg-surface-light/50 border-white/5",
                    idx === 0 && "bg-gradient-to-r from-accent/20 to-surface-light border-accent/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-bold text-text-secondary">
                      #{entry.rank}
                    </div>
                    <Avatar name={entry.playerName} color={entry.avatarColor} size="sm" />
                    <span className={cn("font-medium max-w-[120px] truncate", entry.playerId === socketId ? "text-primary" : "text-white")}>
                      {entry.playerName} {entry.playerId === socketId && "(You)"}
                    </span>
                  </div>
                  <div className="font-heading font-bold text-lg">
                    {entry.totalScore}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl">
            {isFinal ? (
              <Button size="lg" className="w-full" onClick={handleGoHome}>
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            ) : isReviewing ? (
              isHost ? (
                <Button size="lg" className="w-full" onClick={handleConfirmReview}>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Confirm Results
                </Button>
              ) : (
                <div className="text-center p-4 bg-surface-light rounded-xl border border-white/5">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-secondary">Waiting for host to verify answers...</p>
                </div>
              )
            ) : isHost ? (
              <Button size="lg" className="w-full" onClick={handleNextRound}>
                {roundState?.roundNumber === room.settings.maxRounds ? "Finish Game" : "Next Round"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <div className="text-center p-4 bg-surface-light rounded-xl border border-white/5">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-secondary">Waiting for host to continue...</p>
              </div>
            )}
          </div>
        </div>

      </main>
      
      {/* Add simple keyframes for confetti in JSX since it's just one-off */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}} />
    </div>
  );
}
