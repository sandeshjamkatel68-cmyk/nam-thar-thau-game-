"use client";
import { useEffect, useState, useCallback } from 'react';
import { Howl } from 'howler';

type SoundName = 'roundStart' | 'stop' | 'tick' | 'winner' | 'message';

const sounds: Record<SoundName, Howl | null> = {
  roundStart: null,
  stop: null,
  tick: null,
  winner: null,
  message: null,
};

export function useSound() {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const muted = localStorage.getItem('namTharThauMuted') === 'true';
    setIsMuted(muted);
    Howler.mute(muted);

    // Initialize sounds with fallback placeholders if actual files missing
    sounds.roundStart = new Howl({ src: ['/sounds/round-start.mp3'], volume: 0.5 });
    sounds.stop = new Howl({ src: ['/sounds/stop.mp3'], volume: 0.8 });
    sounds.tick = new Howl({ src: ['/sounds/tick.mp3'], volume: 0.3 });
    sounds.winner = new Howl({ src: ['/sounds/winner.mp3'], volume: 0.7 });
    sounds.message = new Howl({ src: ['/sounds/message.mp3'], volume: 0.4 });
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const playSound = useCallback((name: SoundName) => {
    if (!isMuted && sounds[name]) {
      sounds[name]?.play();
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    Howler.mute(newMuted);
    localStorage.setItem('namTharThauMuted', String(newMuted));
  }, [isMuted]);

  return { playSound, isMuted, toggleMute };
}
