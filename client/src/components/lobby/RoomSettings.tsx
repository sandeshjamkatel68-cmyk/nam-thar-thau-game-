import React from 'react';
import { RoomSettings as ISettings, SocketEvents } from 'shared/types';
import { useSocket } from '../../hooks/useSocket';
import { cn } from '../../lib/utils';

interface RoomSettingsProps {
  roomCode: string;
  settings: ISettings;
  isHost: boolean;
}

export const RoomSettings: React.FC<RoomSettingsProps> = ({ roomCode, settings, isHost }) => {
  const { socket } = useSocket();

  const handleUpdate = (updates: Partial<ISettings>) => {
    if (!isHost) return;
    socket.emit(SocketEvents.ROOM_UPDATE_SETTINGS, {
      roomCode,
      settings: updates
    });
  };

  const OptionGroup = ({ 
    label, 
    options, 
    value, 
    onChange 
  }: { 
    label: string, 
    options: { label: string, val: number }[], 
    value: number, 
    onChange: (val: number) => void 
  }) => (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-secondary pl-1">{label}</span>
      <div className="flex gap-2 bg-surface p-1 rounded-xl border border-white/5">
        {options.map((opt) => (
          <button
            key={opt.val}
            disabled={!isHost}
            onClick={() => onChange(opt.val)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              value === opt.val 
                ? "bg-primary text-white shadow-md" 
                : "text-text-secondary hover:text-white hover:bg-white/5",
              !isHost && "cursor-default"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-5 bg-surface-light/30 rounded-2xl border border-white/5">
      <OptionGroup
        label="Number of Rounds"
        value={settings.maxRounds}
        onChange={(val) => handleUpdate({ maxRounds: val })}
        options={[
          { label: '3', val: 3 },
          { label: '5', val: 5 },
          { label: '10', val: 10 },
        ]}
      />
      
      <OptionGroup
        label="Timer Duration"
        value={settings.timerDuration}
        onChange={(val) => handleUpdate({ timerDuration: val })}
        options={[
          { label: '30s', val: 30 },
          { label: '60s', val: 60 },
          { label: '90s', val: 90 },
          { label: 'None', val: 0 },
        ]}
      />
      
      {!isHost && (
        <div className="text-xs text-center text-accent mt-2">
          Only the host can change settings
        </div>
      )}
    </div>
  );
};
