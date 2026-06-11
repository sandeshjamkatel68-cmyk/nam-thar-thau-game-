import { customAlphabet } from 'nanoid';
import { Room } from '../models/Room.js';

// Exclude ambiguous characters (0, O, 1, I, l)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generate = customAlphabet(ALPHABET, 6);

export async function generateUniqueRoomCode(): Promise<string> {
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = generate();
    const existingRoom = await Room.findOne({ roomCode: code, status: { $ne: 'finished' } });
    if (!existingRoom) {
      isUnique = true;
      return code;
    }
  }
  
  return generate(); // Fallback
}
