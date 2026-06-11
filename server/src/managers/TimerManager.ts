class TimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startTimer(roomCode: string, durationSeconds: number, onExpire: () => void) {
    this.stopTimer(roomCode); // Clear existing

    if (durationSeconds <= 0) return; // No timer

    const timeoutId = setTimeout(() => {
      this.timers.delete(roomCode);
      onExpire();
    }, durationSeconds * 1000);

    this.timers.set(roomCode, timeoutId);
  }

  stopTimer(roomCode: string) {
    const timeoutId = this.timers.get(roomCode);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timers.delete(roomCode);
    }
  }
}

export const timerManager = new TimerManager();
