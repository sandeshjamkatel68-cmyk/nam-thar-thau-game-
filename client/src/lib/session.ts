"use client";

const ROOM_CODE_KEY = 'namTharThauRoomCode';

// Remembers which room this tab is part of so a refresh/accidental back
// navigation can automatically rejoin instead of dropping the player.
export function saveRoomSession(roomCode: string) {
  sessionStorage.setItem(ROOM_CODE_KEY, roomCode);
}

export function getSavedRoomCode(): string | null {
  return sessionStorage.getItem(ROOM_CODE_KEY);
}

export function clearRoomSession() {
  sessionStorage.removeItem(ROOM_CODE_KEY);
}
