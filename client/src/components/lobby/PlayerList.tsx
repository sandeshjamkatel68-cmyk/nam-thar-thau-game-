import React from 'react';
import { Player } from 'shared/types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { UserMinus } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, hostId, isHost, onKick }) => {
  return (
    <div className="flex flex-col gap-2 w-full max-h-[400px] overflow-y-auto pr-2">
      {players.map((player) => (
        <div 
          key={player.socketId} 
          className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar name={player.name} color={player.avatarColor} isConnected={player.isConnected} />
            <div className="flex flex-col">
              <span className="font-medium text-white">{player.name}</span>
              {player.socketId === hostId && (
                <Badge variant="host" className="w-fit mt-1 text-[10px] px-1.5 py-0">Host</Badge>
              )}
            </div>
          </div>
          
          {isHost && player.socketId !== hostId && onKick && (
            <button
              onClick={() => onKick(player.socketId)}
              className="p-2 rounded-lg text-text-secondary hover:bg-danger/20 hover:text-danger transition-colors"
              title={`Kick ${player.name}`}
            >
              <UserMinus className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      
      {/* Empty slots for visual padding if few players */}
      {players.length < 4 && Array.from({ length: 4 - players.length }).map((_, i) => (
        <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 opacity-50">
          <div className="w-10 h-10 rounded-full bg-surface-light" />
          <div className="w-24 h-4 rounded-md bg-surface-light" />
        </div>
      ))}
    </div>
  );
};
