import { useCallback, useEffect, useRef, useState } from "react";

export type StopwatchStatus = "idle" | "running" | "paused";

export interface StopwatchState {
  timeElapsed: number;
  status: StopwatchStatus;
}

export function useStopwatch(): {
  timeElapsed: number;
  status: StopwatchStatus;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  formatTime: string;
} {
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [status, setStatus] = useState<StopwatchStatus>("idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (status === "idle" || status === "paused") {
      setStatus("running");
    }
  }, [status]);

  const pause = useCallback(() => {
    if (status === "running") {
      setStatus("paused");
    }
  }, [status]);

  const stop = useCallback(() => {
    setStatus("idle");
    setTimeElapsed(0);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTimeElapsed(0);
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  const formatTimeString = useCallback((secondsTotal: number): string => {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return {
    timeElapsed,
    status,
    start,
    pause,
    stop,
    reset,
    formatTime: formatTimeString(timeElapsed),
  };
}
