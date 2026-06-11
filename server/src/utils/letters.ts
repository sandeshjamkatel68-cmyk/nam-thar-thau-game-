import { LETTER_POOL } from 'shared/types.js';

export function getRandomLetters(count: number): string[] {
  const pool = [...LETTER_POOL];
  const selected: string[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return selected;
}

export function getAllLetters(): string[] {
  return [...LETTER_POOL];
}
