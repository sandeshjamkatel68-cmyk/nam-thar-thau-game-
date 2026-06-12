import { Room as RoomType, Player, RoomSettings, DEFAULT_SETTINGS, AVATAR_COLORS, ChatMessage } from 'shared/types.js';
import { generateUniqueRoomCode } from '../utils/roomCode.js';
import { Room } from '../models/Room.js';

const RECONNECT_GRACE_MS = 30_000;
const CHAT_HISTORY_LIMIT = 50;

class RoomManager {
  private activeRooms: Map<string, RoomType> = new Map();
  private chatHistory: Map<string, ChatMessage[]> = new Map();
  private removalTimers: Map<string, NodeJS.Timeout> = new Map();

  private getRandomColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  }

  async createRoom(playerName: string, socketId: string, clientId: string): Promise<RoomType> {
    const roomCode = await generateUniqueRoomCode();

    const hostPlayer: Player = {
      socketId,
      clientId,
      name: playerName,
      avatarColor: this.getRandomColor(),
      isHost: true,
      isConnected: true,
      joinedAt: Date.now()
    };

    const room: RoomType = {
      roomCode,
      hostPlayerId: socketId,
      players: [hostPlayer],
      settings: { ...DEFAULT_SETTINGS },
      status: 'waiting',
      currentRound: 0,
      createdAt: Date.now()
    };

    this.activeRooms.set(roomCode, room);

    // Persist to DB
    await Room.create(room);

    return room;
  }

  async joinRoom(roomCode: string, playerName: string, socketId: string, clientId: string): Promise<{ room: RoomType, newPlayer: Player }> {
    const room = this.activeRooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.players.some(p => p.socketId === socketId)) {
      throw new Error('Player already in room');
    }

    const newPlayer: Player = {
      socketId,
      clientId,
      name: playerName,
      avatarColor: this.getRandomColor(),
      isHost: false,
      isConnected: true,
      joinedAt: Date.now()
    };

    room.players.push(newPlayer);
    
    // Update DB async
    Room.updateOne({ roomCode }, { players: room.players }).exec().catch(console.error);

    return { room, newPlayer };
  }

  leaveRoom(roomCode: string, socketId: string): { room: RoomType | undefined, hostChanged: boolean, newHostId?: string, isEmptied: boolean } {
    const room = this.activeRooms.get(roomCode);
    if (!room) return { room: undefined, hostChanged: false, isEmptied: false };

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return { room, hostChanged: false, isEmptied: false };

    const wasHost = room.players[playerIndex].isHost;
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.activeRooms.delete(roomCode);
      Room.updateOne({ roomCode }, { status: 'finished', players: [] }).exec().catch(console.error);
      return { room: undefined, hostChanged: false, isEmptied: true };
    }

    let hostChanged = false;
    let newHostId: string | undefined;

    if (wasHost && room.players.length > 0) {
      // Reassign host to oldest connected player
      room.players.sort((a, b) => a.joinedAt - b.joinedAt);
      room.players[0].isHost = true;
      room.hostPlayerId = room.players[0].socketId;
      hostChanged = true;
      newHostId = room.hostPlayerId;
    }

    // Update DB async
    Room.updateOne({ roomCode }, { players: room.players, hostPlayerId: room.hostPlayerId }).exec().catch(console.error);

    return { room, hostChanged, newHostId, isEmptied: false };
  }

  rejoinRoom(roomCode: string, clientId: string, newSocketId: string, playerName: string): { room: RoomType, oldSocketId: string } {
    const room = this.activeRooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.clientId === clientId);
    if (!player) throw new Error('Player not found in room');

    const oldSocketId = player.socketId;
    player.socketId = newSocketId;
    player.isConnected = true;
    if (playerName) player.name = playerName;

    if (room.hostPlayerId === oldSocketId) {
      room.hostPlayerId = newSocketId;
    }

    this.cancelRemoval(roomCode, oldSocketId);

    // Update DB async
    Room.updateOne({ roomCode }, { players: room.players, hostPlayerId: room.hostPlayerId }).exec().catch(console.error);

    return { room, oldSocketId };
  }

  markDisconnected(socketId: string): { roomCode: string; room: RoomType } | null {
    for (const [roomCode, room] of this.activeRooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        Room.updateOne({ roomCode }, { players: room.players }).exec().catch(console.error);
        return { roomCode, room };
      }
    }
    return null;
  }

  scheduleRemoval(roomCode: string, socketId: string, onExpire: () => void) {
    this.cancelRemoval(roomCode, socketId);
    const timer = setTimeout(() => {
      this.removalTimers.delete(`${roomCode}:${socketId}`);
      onExpire();
    }, RECONNECT_GRACE_MS);
    this.removalTimers.set(`${roomCode}:${socketId}`, timer);
  }

  cancelRemoval(roomCode: string, socketId: string) {
    const key = `${roomCode}:${socketId}`;
    const timer = this.removalTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.removalTimers.delete(key);
    }
  }

  addChatMessage(roomCode: string, message: ChatMessage) {
    const history = this.chatHistory.get(roomCode) || [];
    history.push(message);
    if (history.length > CHAT_HISTORY_LIMIT) history.shift();
    this.chatHistory.set(roomCode, history);
  }

  getChatHistory(roomCode: string): ChatMessage[] {
    return this.chatHistory.get(roomCode) || [];
  }

  kickPlayer(roomCode: string, targetId: string, requesterId: string): RoomType {
    const room = this.activeRooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== requesterId) {
      throw new Error('Only the host can kick players');
    }

    const playerIndex = room.players.findIndex(p => p.socketId === targetId);
    if (playerIndex === -1) throw new Error('Player not found in room');

    room.players.splice(playerIndex, 1);
    
    // Update DB async
    Room.updateOne({ roomCode }, { players: room.players }).exec().catch(console.error);

    return room;
  }

  getRoom(roomCode: string): RoomType | undefined {
    return this.activeRooms.get(roomCode);
  }

  updateSettings(roomCode: string, settings: Partial<RoomSettings>, requesterId: string): RoomType {
    const room = this.activeRooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== requesterId) {
      throw new Error('Only the host can update settings');
    }

    room.settings = { ...room.settings, ...settings };
    
    // Update DB async
    Room.updateOne({ roomCode }, { settings: room.settings }).exec().catch(console.error);

    return room;
  }
  
  updateRoomStatus(roomCode: string, status: RoomType['status']) {
    const room = this.activeRooms.get(roomCode);
    if (room) {
      room.status = status;
      Room.updateOne({ roomCode }, { status }).exec().catch(console.error);
    }
  }
  
  incrementRound(roomCode: string) {
    const room = this.activeRooms.get(roomCode);
    if (room) {
      room.currentRound += 1;
      Room.updateOne({ roomCode }, { currentRound: room.currentRound }).exec().catch(console.error);
    }
  }
  
  resetRoomForPlayAgain(roomCode: string) {
    const room = this.activeRooms.get(roomCode);
    if (room) {
      room.status = 'waiting';
      room.currentRound = 0;
      Room.updateOne({ roomCode }, { status: 'waiting', currentRound: 0 }).exec().catch(console.error);
    }
  }

  cleanupRoom(roomCode: string) {
    this.chatHistory.delete(roomCode);
  }
}

export const roomManager = new RoomManager();
