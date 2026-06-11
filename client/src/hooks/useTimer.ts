"use client";
import { useState, useEffect } from 'react';

export function useTimer(endTime: number | null) {
  const [remaining, setRemaining] = useState<number>(0);
  const [initialDuration, setInitialDuration] = useState<number>(0);

  useEffect(() => {
    if (!endTime) {
      setRemaining(0);
      setInitialDuration(0);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      return diff;
    };

    const initial = calculateRemaining();
    setRemaining(initial);
    if (initialDuration === 0) {
      setInitialDuration(initial);
    }

    const interval = setInterval(() => {
      const current = calculateRemaining();
      setRemaining(current);
      if (current <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const isUrgent = remaining > 0 && remaining <= 10;
  const isExpired = endTime !== null && remaining <= 0;
  const progress = initialDuration > 0 ? (initialDuration - remaining) / initialDuration : 0;

  return { remaining, isUrgent, isExpired, progress };
}
