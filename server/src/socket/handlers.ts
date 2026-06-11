import { Server, Socket } from 'socket.io';
import { 
  SocketEvents, 
  CreateRoomPayload, 
  JoinRoomPayload, 
  KickPlayerPayload, 
  UpdateSettingsPayload, 
  PickLetterPayload, 
  UpdateAnswerPayload, 
  StopGamePayload, 
  NextRoundPayload,
  ChatSendPayload,
  ChatMessage
} from 'shared/types.js';
import { roomManager } from '../managers/RoomManager.js';
import { gameManager } from '../managers/GameManager.js';
import { timerManager } from '../managers/TimerManager.js';
import { getAllLetters } from '../utils/letters.js';
import { randomUUID } from 'crypto';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    // ============================================
    // ROOM EVENTS
    // ============================================

    socket.on(SocketEvents.ROOM_CREATE, async (payload: CreateRoomPayload) => {
      try {
        const room = await roomManager.createRoom(payload.playerName, socket.id);
        socket.join(room.roomCode);
        socket.emit(SocketEvents.ROOM_CREATED, { roomCode: room.roomCode, room });
      } catch (error: any) {
        socket.emit(SocketEvents.ROOM_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.ROOM_JOIN, async (payload: JoinRoomPayload) => {
      try {
        const { room, newPlayer } = await roomManager.joinRoom(payload.roomCode, payload.playerName, socket.id);
        socket.join(payload.roomCode);
        
        // Notify others
        socket.to(payload.roomCode).emit(SocketEvents.ROOM_PLAYER_JOINED, newPlayer);
        
        // Send current state to new player
        socket.emit(SocketEvents.ROOM_JOINED, { room });
      } catch (error: any) {
        socket.emit(SocketEvents.ROOM_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.ROOM_LEAVE, (payload: { roomCode: string }) => {
      try {
        const { room, hostChanged, newHostId, isEmptied } = roomManager.leaveRoom(payload.roomCode, socket.id);
        socket.leave(payload.roomCode);

        if (isEmptied) {
          gameManager.cleanupRoom(payload.roomCode);
          return;
        }

        socket.to(payload.roomCode).emit(SocketEvents.ROOM_PLAYER_LEFT, { playerId: socket.id });
        
        if (hostChanged && newHostId) {
          io.to(payload.roomCode).emit(SocketEvents.ROOM_HOST_CHANGED, { newHostId });
        }
      } catch (error: any) {
        socket.emit(SocketEvents.ROOM_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.ROOM_KICK, (payload: KickPlayerPayload) => {
      try {
        const room = roomManager.kickPlayer(payload.roomCode, payload.targetPlayerId, socket.id);
        
        // Force the target socket to leave the room
        const targetSocket = io.sockets.sockets.get(payload.targetPlayerId);
        if (targetSocket) {
          targetSocket.leave(payload.roomCode);
          targetSocket.emit(SocketEvents.ROOM_PLAYER_KICKED);
        }
        
        io.to(payload.roomCode).emit(SocketEvents.ROOM_PLAYER_LEFT, { playerId: payload.targetPlayerId });
      } catch (error: any) {
        socket.emit(SocketEvents.ROOM_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.ROOM_UPDATE_SETTINGS, (payload: UpdateSettingsPayload) => {
      try {
        const room = roomManager.updateSettings(payload.roomCode, payload.settings, socket.id);
        io.to(payload.roomCode).emit(SocketEvents.ROOM_SETTINGS_UPDATED, { settings: room.settings });
      } catch (error: any) {
        socket.emit(SocketEvents.ROOM_ERROR, { message: error.message });
      }
    });

    // ============================================
    // GAME EVENTS
    // ============================================

    socket.on(SocketEvents.GAME_START, (payload: { roomCode: string }) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room) throw new Error('Room not found');
        if (room.hostPlayerId !== socket.id) throw new Error('Only host can start game');
        if (room.players.length < 2) throw new Error('Need at least 2 players to start');

        const roundState = gameManager.startGame(payload.roomCode);
        
        io.to(payload.roomCode).emit(SocketEvents.GAME_STARTED);
        
        // Send round start with letter options to the picker
        const letterOptions = getAllLetters();
        io.to(payload.roomCode).emit(SocketEvents.GAME_ROUND_START, {
          roundNumber: roundState.roundNumber,
          letterPickerId: roundState.letterPickerId,
          letterPickerName: roundState.letterPickerName,
          letterOptions
        });

      } catch (error: any) {
        socket.emit(SocketEvents.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.GAME_PICK_LETTER, (payload: PickLetterPayload) => {
      try {
        const roundState = gameManager.pickLetter(payload.roomCode, payload.letter, socket.id);
        
        io.to(payload.roomCode).emit(SocketEvents.GAME_LETTER_PICKED, {
          letter: roundState.letter,
          endTime: roundState.endTime
        });

        const room = roomManager.getRoom(payload.roomCode);
        if (room && room.settings.timerDuration > 0) {
          io.to(payload.roomCode).emit(SocketEvents.GAME_TIMER_START, { duration: room.settings.timerDuration });
          
          // Setup server timer
          timerManager.startTimer(payload.roomCode, room.settings.timerDuration, async () => {
            io.to(payload.roomCode).emit(SocketEvents.GAME_TIMER_EXPIRED);
            handleRoundStop(payload.roomCode, null);
          });
        }

      } catch (error: any) {
        socket.emit(SocketEvents.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.GAME_UPDATE_ANSWER, (payload: UpdateAnswerPayload) => {
      try {
        const { filledCount } = gameManager.updateAnswer(payload.roomCode, socket.id, payload.category, payload.value);
        
        // Broadcast progress to others (just the count, not the answers)
        socket.to(payload.roomCode).emit(SocketEvents.GAME_PLAYER_PROGRESS, {
          playerId: socket.id,
          filledCount
        });

      } catch (error: any) {
        // Only emit to the specific player if there's an error updating their answer
        socket.emit(SocketEvents.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.GAME_STOP, (payload: StopGamePayload) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        handleRoundStop(payload.roomCode, socket.id, player.name);

      } catch (error: any) {
        socket.emit(SocketEvents.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(SocketEvents.GAME_NEXT_ROUND, (payload: NextRoundPayload) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room) throw new Error('Room not found');
        if (room.hostPlayerId !== socket.id) throw new Error('Only host can proceed to next round');

        const roundState = gameManager.nextRound(payload.roomCode);
        
        if (roundState) {
          const letterOptions = getAllLetters();
          io.to(payload.roomCode).emit(SocketEvents.GAME_ROUND_START, {
            roundNumber: roundState.roundNumber,
            letterPickerId: roundState.letterPickerId,
            letterPickerName: roundState.letterPickerName,
            letterOptions
          });
        } else {
          // Game Over
          const { finalLeaderboard, winner } = gameManager.endGame(payload.roomCode);
          io.to(payload.roomCode).emit(SocketEvents.GAME_FINISHED, {
            finalLeaderboard,
            winner
          });
        }

      } catch (error: any) {
        socket.emit(SocketEvents.GAME_ERROR, { message: error.message });
      }
    });

    // Helper for round stop
    const handleRoundStop = async (roomCode: string, stoppedById: string | null, stoppedByName: string = 'Timer') => {
      const roundState = gameManager.stopRound(roomCode, stoppedById);
      
      io.to(roomCode).emit(SocketEvents.GAME_STOPPED, { 
        stoppedBy: stoppedById,
        stoppedByName
      });

      // Give a small delay before showing results for dramatic effect
      setTimeout(async () => {
        const { results, leaderboard } = await gameManager.calculateResults(roomCode);
        io.to(roomCode).emit(SocketEvents.GAME_ROUND_RESULTS, {
          results,
          leaderboard,
          roundNumber: roundState.roundNumber
        });
      }, 2000);
    };

    // ============================================
    // CHAT EVENTS
    // ============================================

    socket.on(SocketEvents.CHAT_SEND, (payload: ChatSendPayload) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        const chatMessage: ChatMessage = {
          id: randomUUID(),
          playerId: socket.id,
          playerName: player.name,
          avatarColor: player.avatarColor,
          message: payload.message,
          timestamp: Date.now()
        };

        io.to(payload.roomCode).emit(SocketEvents.CHAT_MESSAGE, chatMessage);

      } catch (error) {
        console.error('Chat error:', error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      const res = roomManager.handleDisconnect(socket.id);
      
      if (res) {
        if (res.isEmptied) {
          gameManager.cleanupRoom(res.roomCode);
        } else {
          io.to(res.roomCode).emit(SocketEvents.ROOM_PLAYER_LEFT, { playerId: socket.id });
          if (res.hostChanged && res.newHostId) {
            io.to(res.roomCode).emit(SocketEvents.ROOM_HOST_CHANGED, { newHostId: res.newHostId });
          }
        }
      }
    });
  });
}
