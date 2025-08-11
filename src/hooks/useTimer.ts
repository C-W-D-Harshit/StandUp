import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  timeRemaining: number;
  status: TimerStatus;
  initialDuration: number;
}

export function useTimer(initialDuration: number = 15 * 60) {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (status === 'idle' || status === 'paused') {
      setStatus('running');
    }
  }, [status]);

  const pause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
    }
  }, [status]);

  const stop = useCallback(() => {
    setStatus('idle');
    setTimeRemaining(initialDuration);
  }, [initialDuration]);

  const reset = useCallback(() => {
    setStatus('idle');
    setTimeRemaining(initialDuration);
  }, [initialDuration]);

  const setDuration = useCallback((duration: number) => {
    setTimeRemaining(duration);
    if (status === 'idle') {
      // Only update initial duration if timer is idle
      setStatus('idle');
    }
  }, [status]);

  // Timer countdown effect
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setStatus('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // Update timer when initialDuration changes
  useEffect(() => {
    if (status === 'idle') {
      setTimeRemaining(initialDuration);
    }
  }, [initialDuration, status]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    status,
    start,
    pause,
    stop,
    reset,
    setDuration,
    formatTime: formatTime(timeRemaining),
    progress: initialDuration > 0 ? ((initialDuration - timeRemaining) / initialDuration) * 100 : 0,
  };
}