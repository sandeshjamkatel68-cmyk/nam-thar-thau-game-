import { 
  Submission, 
  PlayerRoundResult, 
  CATEGORIES, 
  Category, 
  POINTS_UNIQUE, 
  POINTS_DUPLICATE, 
  POINTS_INVALID, 
  AnswerStatuses, 
  Player 
} from 'shared/types.js';

export function validateAnswer(answer: string, letter: string): boolean {
  if (!answer || answer.trim() === '') return false;
  return answer.trim().toLowerCase().startsWith(letter.toLowerCase());
}

export function calculateRoundScores(
  submissions: Submission[], 
  letter: string, 
  players: Player[]
): PlayerRoundResult[] {
  
  // Track all answers per category to detect duplicates
  const answersByCategory: Record<Category, string[]> = {
    name: [],
    surname: [],
    place: [],
    food: [],
    animal: []
  };

  // Collect all valid answers
  for (const sub of submissions) {
    for (const cat of CATEGORIES) {
      const val = sub.answers[cat];
      if (validateAnswer(val, letter)) {
        answersByCategory[cat].push(val.trim().toLowerCase());
      }
    }
  }

  // Helper to check if an answer is duplicate
  const isDuplicate = (cat: Category, val: string) => {
    const normalized = val.trim().toLowerCase();
    const count = answersByCategory[cat].filter(a => a === normalized).length;
    return count > 1;
  };

  const results: PlayerRoundResult[] = [];

  for (const player of players) {
    const sub = submissions.find(s => s.playerId === player.socketId);
    
    // If player didn't submit, create empty submission
    const answers = sub ? sub.answers : { name: '', surname: '', place: '', food: '', animal: '' };
    
    const scores: Record<Category, number> = { name: 0, surname: 0, place: 0, food: 0, animal: 0 };
    const answerStatuses: AnswerStatuses = { name: 'empty', surname: 'empty', place: 'empty', food: 'empty', animal: 'empty' };
    let roundScore = 0;

    for (const cat of CATEGORIES) {
      const val = answers[cat];
      
      if (!val || val.trim() === '') {
        answerStatuses[cat] = 'empty';
        scores[cat] = 0;
      } else if (!validateAnswer(val, letter)) {
        answerStatuses[cat] = 'invalid';
        scores[cat] = POINTS_INVALID;
      } else if (isDuplicate(cat, val)) {
        answerStatuses[cat] = 'duplicate';
        scores[cat] = POINTS_DUPLICATE;
      } else {
        answerStatuses[cat] = 'unique';
        scores[cat] = POINTS_UNIQUE;
        roundScore += POINTS_UNIQUE;
      }
    }

    results.push({
      playerId: player.socketId,
      playerName: player.name,
      avatarColor: player.avatarColor,
      answers,
      scores,
      answerStatuses,
      roundScore
    });
  }

  return results;
}
