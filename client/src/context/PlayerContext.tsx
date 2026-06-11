"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

interface PlayerContextType {
  playerName: string;
  setPlayerName: (name: string) => void;
  socketId: string;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerNameState] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    const savedName = sessionStorage.getItem('namTharThauPlayerName');
    if (savedName) {
      setPlayerNameState(savedName);
    }
  }, []);

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    sessionStorage.setItem('namTharThauPlayerName', name);
  };

  return (
    <PlayerContext.Provider value={{ playerName, setPlayerName, socketId: socket.id || '' }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
