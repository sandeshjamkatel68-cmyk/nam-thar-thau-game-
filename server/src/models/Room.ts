import mongoose, { Schema, Document } from 'mongoose';
import { Room as IRoom, Player, RoomSettings, RoomStatus } from 'shared/types.js';

export interface RoomDocument extends Document, Omit<IRoom, 'players' | 'settings'> {
  players: Player[];
  settings: RoomSettings;
}

const PlayerSchema = new Schema<Player>({
  socketId: { type: String, required: true },
  name: { type: String, required: true },
  avatarColor: { type: String, required: true },
  isHost: { type: Boolean, required: true },
  isConnected: { type: Boolean, required: true },
  joinedAt: { type: Number, required: true },
});

const RoomSettingsSchema = new Schema<RoomSettings>({
  maxRounds: { type: Number, required: true, default: 5 },
  timerDuration: { type: Number, required: true, default: 60 },
  maxPlayers: { type: Number, required: true, default: 10 },
});

const RoomSchema = new Schema<RoomDocument>(
  {
    roomCode: { type: String, required: true, unique: true },
    hostPlayerId: { type: String, required: true },
    players: { type: [PlayerSchema], default: [] },
    settings: { type: RoomSettingsSchema, default: () => ({}) },
    status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
    currentRound: { type: Number, default: 0 },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

// TTL index to auto-delete old rooms after 24 hours
RoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const Room = mongoose.model<RoomDocument>('Room', RoomSchema);
