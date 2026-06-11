import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { SocketEvents } from 'shared/types';
import { useCallback } from 'react';

export function useChat() {
  const { chatMessages, room } = useGame();
  const { socket } = useSocket();

  const sendMessage = useCallback((message: string) => {
    if (room && message.trim()) {
      socket.emit(SocketEvents.CHAT_SEND, {
        roomCode: room.roomCode,
        message: message.trim()
      });
    }
  }, [socket, room]);

  return { chatMessages, sendMessage };
}
