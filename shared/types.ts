// ============================================
// Nam Thar Thau Falful — Shared Types
// ============================================

// --- Categories ---
export const CATEGORIES = ['name', 'surname', 'place', 'food', 'animal'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  name: 'Name',
  surname: 'Surname (Thar)',
  place: 'Place (Thau)',
  food: 'Food / Fruit',
  animal: 'Animal',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  name: '👤',
  surname: '👨‍👩‍👧‍👦',
  place: '📍',
  food: '🍎',
  animal: '🐾',
};

// --- Answers ---
export type Answers = Record<Category, string>;

export const EMPTY_ANSWERS: Answers = {
  name: '',
  surname: '',
  place: '',
  food: '',
  animal: '',
};

// --- Answer Status ---
export type AnswerStatus = 'unique' | 'duplicate' | 'invalid' | 'empty' | 'repeated';

export type AnswerStatuses = Record<Category, AnswerStatus>;

// --- Player ---
export interface Player {
  socketId: string;
  clientId: string; // stable identity persisted client-side, survives reconnects
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number; // timestamp
}

// --- Room Settings ---
export interface RoomSettings {
  maxRounds: number;    // 3, 5, 10
  timerDuration: number; // 30, 60, 90, or 0 (no timer, stop only)
  maxPlayers: number;   // 2-20
}

export const DEFAULT_SETTINGS: RoomSettings = {
  maxRounds: 5,
  timerDuration: 60,
  maxPlayers: 10,
};

// --- Room ---
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Room {
  roomCode: string;
  hostPlayerId: string;
  players: Player[];
  settings: RoomSettings;
  status: RoomStatus;
  currentRound: number;
  createdAt: number;
}

// --- Submission ---
export interface Submission {
  playerId: string;
  playerName: string;
  answers: Answers;
  submittedAt: number;
  isLocked: boolean;
}

// --- Player Round Result ---
export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  avatarColor: string;
  answers: Answers;
  scores: Record<Category, number>;
  answerStatuses: AnswerStatuses;
  roundScore: number;
}

// --- Round ---
export type RoundPhase = 'picking-letter' | 'playing' | 'stopped' | 'reviewing' | 'results';

export interface RoundState {
  roundNumber: number;
  letter: string;
  letterPickerId: string;
  letterPickerName: string;
  phase: RoundPhase;
  endTime: number | null; // timestamp when round ends (for timer sync)
  stoppedBy: string | null;
  submissions: Submission[];
  results: PlayerRoundResult[];
}

// --- Leaderboard ---
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarColor: string;
  totalScore: number;
  roundsWon: number;
  rank: number;
}

// --- Chat ---
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatarColor: string;
  message: string;
  timestamp: number;
}

// --- Letter Pool ---
export const LETTER_POOL = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z'
] as const;

// --- Avatar Colors ---
export const AVATAR_COLORS = [
  '#E11D48', '#DB2777', '#C026D3', '#9333EA', '#7C3AED',
  '#6366F1', '#4F46E5', '#2563EB', '#0EA5E9', '#06B6D4',
  '#14B8A6', '#10B981', '#22C55E', '#84CC16', '#EAB308',
  '#F59E0B', '#F97316', '#EF4444', '#EC4899', '#8B5CF6',
] as const;

// --- Scoring ---
export const POINTS_UNIQUE = 10;
export const POINTS_DUPLICATE = 0;
export const POINTS_INVALID = 0;

// ============================================
// Socket.IO Event Types
// ============================================

export enum SocketEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECTION_ERROR = 'connect_error',

  // Room events (Client → Server)
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_REJOIN = 'room:rejoin',
  ROOM_LEAVE = 'room:leave',
  ROOM_KICK = 'room:kick',
  ROOM_UPDATE_SETTINGS = 'room:update-settings',

  // Room events (Server → Client)
  ROOM_CREATED = 'room:created',
  ROOM_JOINED = 'room:joined',
  ROOM_REJOIN_SUCCESS = 'room:rejoin-success',
  ROOM_REJOIN_FAILED = 'room:rejoin-failed',
  ROOM_PLAYER_JOINED = 'room:player-joined',
  ROOM_PLAYER_LEFT = 'room:player-left',
  ROOM_PLAYER_KICKED = 'room:player-kicked',
  ROOM_PLAYER_RECONNECTED = 'room:player-reconnected',
  ROOM_PLAYER_DISCONNECTED = 'room:player-disconnected',
  ROOM_SETTINGS_UPDATED = 'room:settings-updated',
  ROOM_HOST_CHANGED = 'room:host-changed',
  ROOM_ERROR = 'room:error',

  // Game events (Client → Server)
  GAME_START = 'game:start',
  GAME_PICK_LETTER = 'game:pick-letter',
  GAME_UPDATE_ANSWER = 'game:update-answer',
  GAME_STOP = 'game:stop',
  GAME_NEXT_ROUND = 'game:next-round',
  GAME_REVIEW_TOGGLE = 'game:review-toggle',
  GAME_REVIEW_CONFIRM = 'game:review-confirm',

  // Game events (Server → Client)
  GAME_STARTED = 'game:started',
  GAME_ROUND_START = 'game:round-start',
  GAME_LETTER_PICKED = 'game:letter-picked',
  GAME_TIMER_START = 'game:timer-start',
  GAME_TIMER_TICK = 'game:timer-tick',
  GAME_TIMER_EXPIRED = 'game:timer-expired',
  GAME_STOPPED = 'game:stopped',
  GAME_REVIEW_START = 'game:review-start',
  GAME_REVIEW_UPDATE = 'game:review-update',
  GAME_ROUND_RESULTS = 'game:round-results',
  GAME_FINISHED = 'game:finished',
  GAME_PLAYER_PROGRESS = 'game:player-progress',
  GAME_ERROR = 'game:error',

  // Chat
  CHAT_SEND = 'chat:send',
  CHAT_MESSAGE = 'chat:message',
}

// ============================================
// Socket.IO Payload Types
// ============================================

// --- Room Payloads ---
export interface CreateRoomPayload {
  playerName: string;
  clientId: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  clientId: string;
}

export interface RejoinRoomPayload {
  roomCode: string;
  playerName: string;
  clientId: string;
}

export interface KickPlayerPayload {
  roomCode: string;
  targetPlayerId: string;
}

export interface UpdateSettingsPayload {
  roomCode: string;
  settings: Partial<RoomSettings>;
}

// --- Game Payloads ---
export interface PickLetterPayload {
  roomCode: string;
  letter: string;
}

export interface UpdateAnswerPayload {
  roomCode: string;
  category: Category;
  value: string;
}

export interface StopGamePayload {
  roomCode: string;
}

export interface NextRoundPayload {
  roomCode: string;
}

export interface ReviewTogglePayload {
  roomCode: string;
  playerId: string;
  category: Category;
}

export interface ReviewConfirmPayload {
  roomCode: string;
}

// --- Response Payloads ---
export interface RoomCreatedPayload {
  roomCode: string;
  room: Room;
}

export interface RoomJoinedPayload {
  room: Room;
}

export interface RoomRejoinSuccessPayload {
  room: Room;
  roundState: RoundState | null;
  leaderboard: LeaderboardEntry[];
  chatMessages: ChatMessage[];
  reviewOverrides: ReviewOverrideKey[];
  letterOptions: string[];
  usedLetters: string[];
}

export interface PlayerReconnectedPayload {
  oldPlayerId: string;
  newPlayerId: string;
  room: Room;
}

export interface PlayerDisconnectedPayload {
  playerId: string;
}

export interface RoundStartPayload {
  roundNumber: number;
  letterPickerId: string;
  letterPickerName: string;
  letterOptions: string[];
  usedLetters: string[];
}

export interface LetterPickedPayload {
  letter: string;
  endTime: number | null;
}

export interface GameStoppedPayload {
  stoppedBy: string;
  stoppedByName: string;
}

export interface RoundResultsPayload {
  results: PlayerRoundResult[];
  leaderboard: LeaderboardEntry[];
  roundNumber: number;
}

// "playerId|category" keys that the host has marked as invalid during review
export type ReviewOverrideKey = string;

export interface ReviewStartPayload {
  results: PlayerRoundResult[];
  overrides: ReviewOverrideKey[];
  roundNumber: number;
}

export interface ReviewUpdatePayload {
  results: PlayerRoundResult[];
  overrides: ReviewOverrideKey[];
}

export interface GameFinishedPayload {
  finalLeaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry;
}

export interface PlayerProgressPayload {
  playerId: string;
  filledCount: number; // 0-5
}

export interface ChatSendPayload {
  roomCode: string;
  message: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
