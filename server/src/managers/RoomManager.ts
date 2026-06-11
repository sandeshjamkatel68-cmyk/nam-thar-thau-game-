import { Room as RoomType, Player, RoomSettings, DEFAULT_SETTINGS, AVATAR_COLORS } from 'shared/types.js';
import { generateUniqueRoomCode } from '../utils/roomCode.js';
import { Room } from '../models/Room.js';

class RoomManager {
  private activeRooms: Map<string, RoomType> = new Map();

  private getRandomColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  }

  async createRoom(playerName: string, socketId: string): Promise<RoomType> {
    const roomCode = await generateUniqueRoomCode();
    
    const hostPlayer: Player = {
      socketId,
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

  async joinRoom(roomCode: string, playerName: string, socketId: string): Promise<{ room: RoomType, newPlayer: Player }> {
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
  
  handleDisconnect(socketId: string): { roomCode: string; room: RoomType | undefined; hostChanged: boolean; newHostId?: string; isEmptied: boolean } | null {
    // Find room containing this socket
    for (const [roomCode, room] of this.activeRooms.entries()) {
      if (room.players.some(p => p.socketId === socketId)) {
        const res = this.leaveRoom(roomCode, socketId);
        return { roomCode, ...res };
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
