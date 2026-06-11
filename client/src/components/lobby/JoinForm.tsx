"use client";
import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePlayer } from '../../context/PlayerContext';
import { SocketEvents } from 'shared/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const JoinForm: React.FC = () => {
  const { socket } = useSocket();
  const { playerName, setPlayerName, clientId } = usePlayer();
  
  const [code, setCode] = useState('');
  const [name, setName] = useState(playerName);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || code.length !== 6) return;
    
    setIsLoading(true);
    setPlayerName(name.trim());
    
    socket.emit(SocketEvents.ROOM_JOIN, {
      roomCode: code.toUpperCase(),
      playerName: name.trim(),
      clientId
    });

    // Reset loading state after a timeout in case of error (error handled by context)
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-4">
      <Input
        label="Room Code"
        placeholder="Enter 6-character code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
        maxLength={6}
        required
        className="font-mono text-center tracking-widest uppercase text-xl"
      />
      <Input
        label="Your Name"
        placeholder="Enter your display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        required
      />
      <Button 
        type="submit" 
        size="lg" 
        className="w-full mt-2"
        disabled={!name.trim() || code.length !== 6 || isLoading}
        isLoading={isLoading}
      >
        Join Game
      </Button>
    </form>
  );
};
