import React from 'react';
import { Player } from 'shared/types';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface PlayerCardProps {
  player: Player;
  filledCount: number; // 0 to 5
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, filledCount }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={player.name} color={player.avatarColor} size="sm" isConnected={player.isConnected} />
        <span className="font-medium text-white truncate max-w-[100px]" title={player.name}>
          {player.name}
        </span>
      </div>
      
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              i < filledCount ? "bg-success" : "bg-surface-light border border-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
};
