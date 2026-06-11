import { Room as RoomType, RoundState, LeaderboardEntry, Submission, Category, PlayerRoundResult } from 'shared/types.js';
import { Game } from '../models/Game.js';
import { calculateRoundScores } from '../utils/scoring.js';
import { roomManager } from './RoomManager.js';
import { timerManager } from './TimerManager.js';

function createEmptyUsedWords(): Record<Category, Set<string>> {
  return {
    name: new Set(),
    surname: new Set(),
    place: new Set(),
    food: new Set(),
    animal: new Set()
  };
}

class GameManager {
  private activeRounds: Map<string, RoundState> = new Map();
  private leaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private usedWords: Map<string, Record<Category, Set<string>>> = new Map();

  startGame(roomCode: string): RoundState {
    const room = roomManager.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    
    roomManager.updateRoomStatus(roomCode, 'playing');
    roomManager.incrementRound(roomCode);

    // Pick first letter chooser
    const letterPicker = room.players[0]; // For now just pick first

    const roundState: RoundState = {
      roundNumber: 1,
      letter: '',
      letterPickerId: letterPicker.socketId,
      letterPickerName: letterPicker.name,
      phase: 'picking-letter',
      endTime: null,
      stoppedBy: null,
      submissions: [],
      results: []
    };

    this.activeRounds.set(roomCode, roundState);
    this.usedWords.set(roomCode, createEmptyUsedWords());

    // Init leaderboard
    const initialLeaderboard: LeaderboardEntry[] = room.players.map((p, i) => ({
      playerId: p.socketId,
      playerName: p.name,
      avatarColor: p.avatarColor,
      totalScore: 0,
      roundsWon: 0,
      rank: i + 1
    }));
    this.leaderboards.set(roomCode, initialLeaderboard);

    return roundState;
  }

  pickLetter(roomCode: string, letter: string, playerId: string): RoundState {
    const roundState = this.activeRounds.get(roomCode);
    if (!roundState) throw new Error('Round not found');

    if (roundState.letterPickerId !== playerId) {
      throw new Error('You are not the designated letter picker');
    }

    roundState.letter = letter;
    roundState.phase = 'playing';
    
    const room = roomManager.getRoom(roomCode);
    if (room && room.settings.timerDuration > 0) {
      const endTime = Date.now() + (room.settings.timerDuration * 1000);
      roundState.endTime = endTime;
    }

    return roundState;
  }

  updateAnswer(roomCode: string, playerId: string, category: Category, value: string): { roundState: RoundState, submission: Submission, filledCount: number } {
    const roundState = this.activeRounds.get(roomCode);
    if (!roundState) throw new Error('Round not found');

    if (roundState.phase !== 'playing') {
      throw new Error('Round is not currently in playing phase');
    }

    const room = roomManager.getRoom(roomCode);
    const player = room?.players.find(p => p.socketId === playerId);
    if (!player) throw new Error('Player not found in room');

    let sub = roundState.submissions.find(s => s.playerId === playerId);
    if (!sub) {
      sub = {
        playerId,
        playerName: player.name,
        answers: { name: '', surname: '', place: '', food: '', animal: '' },
        submittedAt: Date.now(),
        isLocked: false
      };
      roundState.submissions.push(sub);
    }

    if (sub.isLocked) {
      throw new Error('Your answers are locked');
    }

    sub.answers[category] = value;
    sub.submittedAt = Date.now();

    // Calculate how many fields are filled (not empty)
    const filledCount = Object.values(sub.answers).filter(v => v.trim() !== '').length;

    return { roundState, submission: sub, filledCount };
  }

  stopRound(roomCode: string, playerId: string | null): RoundState {
    const roundState = this.activeRounds.get(roomCode);
    if (!roundState) throw new Error('Round not found');

    if (roundState.phase !== 'playing') {
      return roundState; // Already stopped
    }

    // Lock all submissions
    for (const sub of roundState.submissions) {
      sub.isLocked = true;
    }

    roundState.phase = 'stopped';
    roundState.stoppedBy = playerId;
    
    // Stop server timer if running
    timerManager.stopTimer(roomCode);

    return roundState;
  }

  async calculateResults(roomCode: string): Promise<{ results: PlayerRoundResult[], leaderboard: LeaderboardEntry[], roundState: RoundState }> {
    const roundState = this.activeRounds.get(roomCode);
    const room = roomManager.getRoom(roomCode);
    
    if (!roundState || !room) throw new Error('Round or Room not found');

    roundState.phase = 'results';

    // Calculate scores (also records this round's words to detect repeats in future rounds)
    const usedWords = this.usedWords.get(roomCode) || createEmptyUsedWords();
    const results = calculateRoundScores(roundState.submissions, roundState.letter, room.players, usedWords);
    roundState.results = results;

    // Determine round winner
    let maxRoundScore = -1;
    let roundWinners: string[] = [];
    for (const r of results) {
      if (r.roundScore > maxRoundScore) {
        maxRoundScore = r.roundScore;
        roundWinners = [r.playerId];
      } else if (r.roundScore === maxRoundScore) {
        roundWinners.push(r.playerId);
      }
    }

    // Update leaderboard
    const leaderboard = this.leaderboards.get(roomCode) || [];
    for (const entry of leaderboard) {
      const res = results.find(r => r.playerId === entry.playerId);
      if (res) {
        entry.totalScore += res.roundScore;
        if (roundWinners.includes(entry.playerId) && res.roundScore > 0) {
          entry.roundsWon += 1;
        }
      }
    }

    // Sort leaderboard and assign ranks
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    let currentRank = 1;
    for (let i = 0; i < leaderboard.length; i++) {
      if (i > 0 && leaderboard[i].totalScore < leaderboard[i - 1].totalScore) {
        currentRank = i + 1;
      }
      leaderboard[i].rank = currentRank;
    }
    this.leaderboards.set(roomCode, leaderboard);

    // Save round to DB
    await Game.create({
      roomCode,
      roundNumber: roundState.roundNumber,
      letter: roundState.letter,
      letterPickerId: roundState.letterPickerId,
      submissions: roundState.submissions,
      results: roundState.results,
      stoppedBy: roundState.stoppedBy,
      phase: roundState.phase
    });

    return { results, leaderboard, roundState };
  }

  nextRound(roomCode: string): RoundState | null {
    const room = roomManager.getRoom(roomCode);
    const prevRound = this.activeRounds.get(roomCode);
    
    if (!room || !prevRound) throw new Error('Room or Round not found');

    if (room.currentRound >= room.settings.maxRounds) {
      return null; // Game over
    }

    roomManager.incrementRound(roomCode);

    // Rotate letter picker
    const prevPickerIndex = room.players.findIndex(p => p.socketId === prevRound.letterPickerId);
    let nextPickerIndex = (prevPickerIndex + 1) % room.players.length;
    // Just in case player left
    if (nextPickerIndex < 0 || nextPickerIndex >= room.players.length) nextPickerIndex = 0;
    
    const letterPicker = room.players[nextPickerIndex];

    const roundState: RoundState = {
      roundNumber: room.currentRound,
      letter: '',
      letterPickerId: letterPicker.socketId,
      letterPickerName: letterPicker.name,
      phase: 'picking-letter',
      endTime: null,
      stoppedBy: null,
      submissions: [],
      results: []
    };

    this.activeRounds.set(roomCode, roundState);

    return roundState;
  }

  endGame(roomCode: string): { finalLeaderboard: LeaderboardEntry[], winner: LeaderboardEntry } {
    roomManager.updateRoomStatus(roomCode, 'finished');
    const leaderboard = this.leaderboards.get(roomCode) || [];
    
    const winner = leaderboard[0];
    
    return { finalLeaderboard: leaderboard, winner };
  }

  getRoundState(roomCode: string): RoundState | undefined {
    return this.activeRounds.get(roomCode);
  }

  getLeaderboard(roomCode: string): LeaderboardEntry[] | undefined {
    return this.leaderboards.get(roomCode);
  }
  
  cleanupRoom(roomCode: string) {
    this.activeRounds.delete(roomCode);
    this.leaderboards.delete(roomCode);
    this.usedWords.delete(roomCode);
  }
}

export const gameManager = new GameManager();
