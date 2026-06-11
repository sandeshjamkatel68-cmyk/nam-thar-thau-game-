import mongoose, { Schema, Document } from 'mongoose';
import { Submission, PlayerRoundResult, RoundPhase } from 'shared/types.js';

export interface GameDocument extends Document {
  roomCode: string;
  roundNumber: number;
  letter: string;
  letterPickerId: string;
  submissions: Submission[];
  results: PlayerRoundResult[];
  stoppedBy: string | null;
  phase: RoundPhase;
  createdAt: number;
}

const AnswersSchema = new Schema({
  name: { type: String, default: '' },
  surname: { type: String, default: '' },
  place: { type: String, default: '' },
  food: { type: String, default: '' },
  animal: { type: String, default: '' },
}, { _id: false });

const SubmissionSchema = new Schema<Submission>({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  answers: { type: AnswersSchema, required: true },
  submittedAt: { type: Number, required: true },
  isLocked: { type: Boolean, required: true, default: false },
});

const AnswerStatusesSchema = new Schema({
  name: { type: String, enum: ['unique', 'duplicate', 'invalid', 'empty'], required: true },
  surname: { type: String, enum: ['unique', 'duplicate', 'invalid', 'empty'], required: true },
  place: { type: String, enum: ['unique', 'duplicate', 'invalid', 'empty'], required: true },
  food: { type: String, enum: ['unique', 'duplicate', 'invalid', 'empty'], required: true },
  animal: { type: String, enum: ['unique', 'duplicate', 'invalid', 'empty'], required: true },
}, { _id: false });

const ScoresSchema = new Schema({
  name: { type: Number, required: true },
  surname: { type: Number, required: true },
  place: { type: Number, required: true },
  food: { type: Number, required: true },
  animal: { type: Number, required: true },
}, { _id: false });

const PlayerRoundResultSchema = new Schema<PlayerRoundResult>({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  avatarColor: { type: String, required: true },
  answers: { type: AnswersSchema, required: true },
  scores: { type: ScoresSchema, required: true },
  answerStatuses: { type: AnswerStatusesSchema, required: true },
  roundScore: { type: Number, required: true },
});

const GameSchema = new Schema<GameDocument>(
  {
    roomCode: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    letter: { type: String, default: '' },
    letterPickerId: { type: String, required: true },
    submissions: { type: [SubmissionSchema], default: [] },
    results: { type: [PlayerRoundResultSchema], default: [] },
    stoppedBy: { type: String, default: null },
    phase: { type: String, enum: ['picking-letter', 'playing', 'stopped', 'results'], required: true },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

GameSchema.index({ roomCode: 1, roundNumber: 1 });

export const Game = mongoose.model<GameDocument>('Game', GameSchema);
