"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import {
  Room, RoundState, LeaderboardEntry, SocketEvents,
  RoomCreatedPayload, RoomJoinedPayload, ChatMessage,
  RoundStartPayload, LetterPickedPayload, GameStoppedPayload,
  RoundResultsPayload, GameFinishedPayload, PlayerProgressPayload,
  ReviewStartPayload, ReviewUpdatePayload, RoomRejoinSuccessPayload,
  PlayerReconnectedPayload, PlayerDisconnectedPayload
} from 'shared/types';
import { useRouter } from 'next/navigation';
import { getClientId } from '../lib/clientId';
import { saveRoomSession, getSavedRoomCode, clearRoomSession } from '../lib/session';

interface GameContextType {
  room: Room | null;
  roundState: RoundState | null;
  leaderboard: LeaderboardEntry[];
  chatMessages: ChatMessage[];
  playerProgress: Record<string, number>; // socketId -> filledCount
  finalResults: GameFinishedPayload | null;
  reviewOverrides: string[]; // "playerId|category" keys marked invalid by host during review
  error: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const router = useRouter();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playerProgress, setPlayerProgress] = useState<Record<string, number>>({});
  const [finalResults, setFinalResults] = useState<GameFinishedPayload | null>(null);
  const [reviewOverrides, setReviewOverrides] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Attempt to rejoin a previously-saved room whenever the socket (re)connects
  // (covers page refresh, accidental back/forward, and dropped connections).
  useEffect(() => {
    if (!socket) return;

    const attemptRejoin = () => {
      const savedRoomCode = getSavedRoomCode();
      const savedPlayerName = sessionStorage.getItem('namTharThauPlayerName');
      if (savedRoomCode && savedPlayerName) {
        socket.emit(SocketEvents.ROOM_REJOIN, {
          roomCode: savedRoomCode,
          playerName: savedPlayerName,
          clientId: getClientId()
        });
      }
    };

    socket.on('connect', attemptRejoin);
    if (socket.connected) attemptRejoin();

    return () => {
      socket.off('connect', attemptRejoin);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Room
    socket.on(SocketEvents.ROOM_CREATED, (data: RoomCreatedPayload) => {
      setRoom(data.room);
      saveRoomSession(data.roomCode);
      router.push(`/lobby/${data.roomCode}`);
    });

    socket.on(SocketEvents.ROOM_JOINED, (data: RoomJoinedPayload) => {
      setRoom(data.room);
      saveRoomSession(data.room.roomCode);
      router.push(`/lobby/${data.room.roomCode}`);
    });

    socket.on(SocketEvents.ROOM_REJOIN_SUCCESS, (data: RoomRejoinSuccessPayload) => {
      setRoom(data.room);
      setRoundState(data.roundState ? {
        ...data.roundState,
        letterOptions: data.letterOptions
      } as any : null);
      setLeaderboard(data.leaderboard);
      setChatMessages(data.chatMessages);
      setReviewOverrides(data.reviewOverrides);
      setError(null);
      saveRoomSession(data.room.roomCode);

      const phase = data.roundState?.phase;
      if (data.room.status === 'finished') {
        clearRoomSession();
        router.push('/');
      } else if (phase === 'results' || phase === 'reviewing') {
        router.push(`/results/${data.room.roomCode}`);
      } else if (phase === 'playing' || phase === 'stopped' || phase === 'picking-letter') {
        router.push(`/game/${data.room.roomCode}`);
      } else {
        router.push(`/lobby/${data.room.roomCode}`);
      }
    });

    socket.on(SocketEvents.ROOM_REJOIN_FAILED, (data: { message: string }) => {
      clearRoomSession();
      setError(data.message || "Couldn't reconnect to your previous game.");
      router.push('/');
    });

    socket.on(SocketEvents.ROOM_PLAYER_RECONNECTED, (data: PlayerReconnectedPayload) => {
      setRoom(data.room);
      setPlayerProgress(prev => {
        if (!(data.oldPlayerId in prev)) return prev;
        const { [data.oldPlayerId]: val, ...rest } = prev;
        return { ...rest, [data.newPlayerId]: val };
      });
    });

    socket.on(SocketEvents.ROOM_PLAYER_DISCONNECTED, ({ playerId }: PlayerDisconnectedPayload) => {
      setRoom(prev => prev ? {
        ...prev,
        players: prev.players.map(p => p.socketId === playerId ? { ...p, isConnected: false } : p)
      } : null);
    });

    socket.on(SocketEvents.ROOM_PLAYER_JOINED, (player) => {
      setRoom(prev => prev ? { ...prev, players: [...prev.players, player] } : null);
    });

    socket.on(SocketEvents.ROOM_PLAYER_LEFT, ({ playerId }) => {
      setRoom(prev => prev ? { 
        ...prev, 
        players: prev.players.filter(p => p.socketId !== playerId) 
      } : null);
    });

    socket.on(SocketEvents.ROOM_HOST_CHANGED, ({ newHostId }) => {
      setRoom(prev => prev ? {
        ...prev,
        hostPlayerId: newHostId,
        players: prev.players.map(p => ({ ...p, isHost: p.socketId === newHostId }))
      } : null);
    });

    socket.on(SocketEvents.ROOM_PLAYER_KICKED, () => {
      setRoom(null);
      setError("You were kicked from the room.");
      router.push('/');
    });

    socket.on(SocketEvents.ROOM_SETTINGS_UPDATED, ({ settings }) => {
      setRoom(prev => prev ? { ...prev, settings } : null);
    });

    socket.on(SocketEvents.ROOM_ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    // Game
    socket.on(SocketEvents.GAME_STARTED, () => {
      setRoom(prev => prev ? { ...prev, status: 'playing' } : null);
      setFinalResults(null);
      setLeaderboard([]);
    });

    socket.on(SocketEvents.GAME_ROUND_START, (data: RoundStartPayload & { letterOptions: string[] }) => {
      setRoundState({
        roundNumber: data.roundNumber,
        letterPickerId: data.letterPickerId,
        letterPickerName: data.letterPickerName,
        phase: 'picking-letter',
        letter: '',
        endTime: null,
        stoppedBy: null,
        submissions: [],
        results: [],
        letterOptions: data.letterOptions // Storing temporarily in state for the picker
      } as any);
      setPlayerProgress({});
      if (room) router.push(`/game/${room.roomCode}`);
    });

    socket.on(SocketEvents.GAME_LETTER_PICKED, (data: LetterPickedPayload) => {
      setRoundState(prev => prev ? {
        ...prev,
        letter: data.letter,
        endTime: data.endTime,
        phase: 'playing'
      } : null);
    });

    socket.on(SocketEvents.GAME_PLAYER_PROGRESS, (data: PlayerProgressPayload) => {
      setPlayerProgress(prev => ({ ...prev, [data.playerId]: data.filledCount }));
    });

    socket.on(SocketEvents.GAME_STOPPED, (data: GameStoppedPayload) => {
      setRoundState(prev => prev ? {
        ...prev,
        phase: 'stopped',
        stoppedBy: data.stoppedBy
      } : null);
    });

    socket.on(SocketEvents.GAME_REVIEW_START, (data: ReviewStartPayload) => {
      setRoundState(prev => prev ? {
        ...prev,
        phase: 'reviewing',
        results: data.results
      } : null);
      setReviewOverrides(data.overrides);
      if (room) router.push(`/results/${room.roomCode}`);
    });

    socket.on(SocketEvents.GAME_REVIEW_UPDATE, (data: ReviewUpdatePayload) => {
      setRoundState(prev => prev ? {
        ...prev,
        results: data.results
      } : null);
      setReviewOverrides(data.overrides);
    });

    socket.on(SocketEvents.GAME_ROUND_RESULTS, (data: RoundResultsPayload) => {
      setRoundState(prev => prev ? {
        ...prev,
        phase: 'results',
        results: data.results
      } : null);
      setLeaderboard(data.leaderboard);
      setReviewOverrides([]);
      if (room) router.push(`/results/${room.roomCode}`);
    });

    socket.on(SocketEvents.GAME_FINISHED, (data: GameFinishedPayload) => {
      setFinalResults(data);
      if (room) {
        setRoom(prev => prev ? { ...prev, status: 'finished' } : null);
        router.push(`/results/${room.roomCode}?final=true`);
      }
    });

    socket.on(SocketEvents.GAME_ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    // Chat
    socket.on(SocketEvents.CHAT_MESSAGE, (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off(SocketEvents.ROOM_CREATED);
      socket.off(SocketEvents.ROOM_JOINED);
      socket.off(SocketEvents.ROOM_PLAYER_JOINED);
      socket.off(SocketEvents.ROOM_PLAYER_LEFT);
      socket.off(SocketEvents.ROOM_HOST_CHANGED);
      socket.off(SocketEvents.ROOM_PLAYER_KICKED);
      socket.off(SocketEvents.ROOM_SETTINGS_UPDATED);
      socket.off(SocketEvents.ROOM_ERROR);
      socket.off(SocketEvents.GAME_STARTED);
      socket.off(SocketEvents.GAME_ROUND_START);
      socket.off(SocketEvents.GAME_LETTER_PICKED);
      socket.off(SocketEvents.GAME_PLAYER_PROGRESS);
      socket.off(SocketEvents.GAME_STOPPED);
      socket.off(SocketEvents.GAME_REVIEW_START);
      socket.off(SocketEvents.GAME_REVIEW_UPDATE);
      socket.off(SocketEvents.GAME_ROUND_RESULTS);
      socket.off(SocketEvents.GAME_FINISHED);
      socket.off(SocketEvents.GAME_ERROR);
      socket.off(SocketEvents.CHAT_MESSAGE);
    };
  }, [socket, router, room?.roomCode]);

  const clearError = () => setError(null);

  return (
    <GameContext.Provider value={{
      room, roundState, leaderboard, chatMessages, playerProgress, finalResults, reviewOverrides, error, clearError
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
