export interface TimerPreset {
  label: string;
  minutes: number;
  seconds: number;
}

export type SessionType = "sitting" | "standing";

export interface AppSettings {
  timerDuration: number; // in seconds
  speechEnabled: boolean;
  selectedVoice: string | null;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  currentSession: SessionType;
}

export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  { label: "15 minutes", minutes: 15, seconds: 15 * 60 },
  { label: "30 minutes", minutes: 30, seconds: 30 * 60 },
  { label: "45 minutes", minutes: 45, seconds: 45 * 60 },
  { label: "60 minutes", minutes: 60, seconds: 60 * 60 },
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  timerDuration: 30 * 60, // 30 minutes default
  speechEnabled: true,
  selectedVoice: null,
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  currentSession: "sitting",
} as const;

export const SESSION_MESSAGES = {
  sitting: "Time to stand up! Take a break and change your posture.",
} as const;
