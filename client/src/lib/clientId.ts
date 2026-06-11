"use client";

const CLIENT_ID_KEY = 'namTharThauClientId';

// A stable identity for this browser, persisted in localStorage so a
// reconnecting socket (after a refresh/back navigation/dropped connection)
// can be matched back to the same player slot in a room.
export function getClientId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
