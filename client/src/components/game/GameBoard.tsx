import React, { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useSocket } from '../../hooks/useSocket';
import { useTimer } from '../../hooks/useTimer';
import { Category, CATEGORIES, SocketEvents } from 'shared/types';
import { CategoryInput } from './CategoryInput';
import { StopButton } from './StopButton';
import { Timer } from '../ui/Timer';

export const GameBoard: React.FC = () => {
  const { room, roundState } = useGame();
  const { socket } = useSocket();
  const { remaining, progress, isUrgent, isExpired } = useTimer(roundState?.endTime || null);
  
  const [answers, setAnswers] = useState<Record<Category, string>>({
    name: '',
    surname: '',
    place: '',
    food: '',
    animal: ''
  });

  const isLocked = roundState?.phase === 'stopped' || isExpired;
  
  const allFilled = CATEGORIES.every(cat => answers[cat].trim().length > 0 && answers[cat].trim().toLowerCase().startsWith(roundState?.letter.toLowerCase() || ''));

  const handleAnswerChange = (category: Category, value: string) => {
    if (isLocked) return;
    
    setAnswers(prev => ({ ...prev, [category]: value }));
    
    if (room && roundState?.phase === 'playing') {
      socket.emit(SocketEvents.GAME_UPDATE_ANSWER, {
        roomCode: room.roomCode,
        category,
        value
      });
    }
  };

  const handleStop = () => {
    if (isLocked || !allFilled || !room) return;
    
    socket.emit(SocketEvents.GAME_STOP, {
      roomCode: room.roomCode
    });
  };

  if (!roundState) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-8">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full bg-surface p-4 rounded-2xl border border-white/5 shadow-lg">
        <div className="flex flex-col">
          <span className="text-text-secondary font-medium uppercase tracking-wider text-sm">Letter</span>
          <span className="text-5xl font-heading font-black text-primary drop-shadow-md">
            {roundState.letter}
          </span>
        </div>
        
        {room?.settings.timerDuration ? (
          <Timer 
            remaining={remaining} 
            progress={progress} 
            isUrgent={isUrgent} 
            size="md" 
          />
        ) : (
          <div className="text-text-secondary text-sm font-medium">No Timer</div>
        )}
      </div>

      {/* Inputs */}
      <div className="w-full flex flex-col gap-3">
        {CATEGORIES.map(category => (
          <CategoryInput
            key={category}
            category={category}
            letter={roundState.letter}
            value={answers[category]}
            onChange={(val) => handleAnswerChange(category, val)}
            locked={isLocked}
          />
        ))}
      </div>

      {/* Stop Button */}
      <div className="mt-4">
        <StopButton 
          onStop={handleStop} 
          disabled={!allFilled && !isLocked} 
          isLocked={isLocked} 
        />
      </div>
      
    </div>
  );
};
