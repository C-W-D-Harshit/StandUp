import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useTimer } from "@/hooks/useTimer";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useSpeech } from "@/hooks/useSpeech";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  DEFAULT_TIMER_PRESETS,
  DEFAULT_SETTINGS,
  SESSION_MESSAGES,
} from "@/types";
import type { AppSettings } from "@/types";
import { DevPanel } from "./DevPanel";
import { ModeToggle } from "./mode-toggle";

/**
 * StandingDeskTimer
 *
 * Minimal, focused timer experience for sitting/standing sessions.
 * - Emphasizes a clean layout and legible typography
 * - Uses subtle, neutral surfaces with status indicated via a small colored dot
 * - Keeps secondary actions as unobtrusive icon-controls
 */
export function StandingDeskTimer() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "standing-desk-timer-settings",
    DEFAULT_SETTINGS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const timer = useTimer(settings.timerDuration);
  const standing = useStopwatch();
  const speech = useSpeech();
  const hasAnnouncedRef = useRef<boolean>(false);

  // Handle timer completion: sitting → switch to standing stopwatch, show alert
  useEffect(() => {
    if (timer.status !== "completed") {
      // Leaving completed state: allow next announcement
      hasAnnouncedRef.current = false;
      return;
    }

    // Guard to ensure we only announce once per completion
    if (hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;

    setShowAlert(true);

    const currentMessage = SESSION_MESSAGES.sitting;
    if (settings.speechEnabled && speech.isSupported) {
      // slight delay improves reliability after cancel/speak cycles
      setTimeout(() => {
        speech.speak(currentMessage, {
          enabled: settings.speechEnabled,
          voice: settings.selectedVoice,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          volume: settings.speechVolume,
        });
      }, 300);
    }

    const alertTimer = setTimeout(() => {
      setShowAlert(false);
      speech.stop();
      // switch to standing mode and start stopwatch
      setSettings((prev) => ({ ...prev, currentSession: "standing" }));
      standing.reset();
      standing.start();
      hasAnnouncedRef.current = false;
    }, 15000);

    return () => clearTimeout(alertTimer);
  }, [
    timer.status,
    timer.reset,
    settings.speechEnabled,
    settings.selectedVoice,
    settings.speechRate,
    settings.speechPitch,
    settings.speechVolume,
    speech.isSupported,
    speech.speak,
    speech.stop,
    standing.reset,
    standing.start,
  ]);

  // Update timer duration when settings change
  useEffect(() => {
    timer.setDuration(settings.timerDuration);
  }, [settings.timerDuration, timer.setDuration]);

  // Set default voice if none selected
  useEffect(() => {
    if (!settings.selectedVoice && speech.voices.length > 0) {
      const defaultVoice = speech.getDefaultVoice();
      if (defaultVoice) {
        setSettings((prev) => ({ ...prev, selectedVoice: defaultVoice }));
      }
    }
  }, [
    speech.voices,
    speech.getDefaultVoice,
    settings.selectedVoice,
    setSettings,
  ]);

  const handleTimerPresetChange = (value: string) => {
    const preset = DEFAULT_TIMER_PRESETS.find(
      (p) => p.seconds.toString() === value
    );
    if (preset) {
      setSettings((prev) => ({ ...prev, timerDuration: preset.seconds }));
    }
  };

  const handleVoiceChange = (value: string) => {
    setSettings((prev) => ({ ...prev, selectedVoice: value }));
  };

  const handleSpeechToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, speechEnabled: enabled }));
  };

  const dismissAlert = () => {
    setShowAlert(false);
    // switch to standing mode and start stopwatch immediately
    speech.stop();
    setSettings((prev) => ({ ...prev, currentSession: "standing" }));
    standing.reset();
    standing.start();
    hasAnnouncedRef.current = false;
  };

  const handleShowAlert = () => {
    setShowAlert(true);
  };

  const handleHideAlert = () => {
    setShowAlert(false);
  };

  // Toggle between sitting (countdown) and standing (stopwatch)
  const handleToggleMode = () => {
    speech.stop();
    if (settings.currentSession === "sitting") {
      timer.stop();
      standing.reset();
      setSettings((prev) => ({ ...prev, currentSession: "standing" }));
      standing.start();
    } else {
      standing.stop();
      standing.reset();
      timer.reset();
      setSettings((prev) => ({ ...prev, currentSession: "sitting" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-40">
        <ModeToggle />
      </div>

      <div className="mx-auto max-w-md px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-2xl font-medium tracking-tight text-foreground mb-3">
            Standing Desk Timer
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Take regular breaks to improve your health and productivity
          </p>
          <div className="flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground/80">
              {settings.currentSession === "sitting"
                ? "💺 Sitting mode"
                : "🧍 Standing mode"}
            </div>
          </div>
          {/* Mode switch moved near primary controls below */}
        </div>

        {/* Main Timer Display */}
        <div className="text-center mb-12">
          {/* Status Indicator - neutral pill with colored dot for minimal noise */}
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground/80">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  timer.status === "running"
                    ? "bg-green-500"
                    : timer.status === "paused"
                    ? "bg-yellow-500"
                    : timer.status === "completed"
                    ? "bg-blue-500"
                    : "bg-muted-foreground"
                }`}
              />
              {timer.status === "idle" && "Ready"}
              {timer.status === "running" && "Sitting session"}
              {timer.status === "paused" && "Paused"}
              {timer.status === "completed" && "Time to stand!"}
            </div>
          </div>

          {/* Large Timer Display */}
          {/* Uses tabular-nums for consistent character width */}
          <div className="mb-8">
            <div className="text-6xl sm:text-7xl font-extralight tabular-nums tracking-tighter text-foreground mb-4 leading-none">
              {settings.currentSession === "sitting"
                ? timer.formatTime
                : standing.formatTime}
            </div>
            <div className="text-sm text-muted-foreground">
              {settings.currentSession === "sitting"
                ? DEFAULT_TIMER_PRESETS.find(
                    (p) => p.seconds === settings.timerDuration
                  )?.label || "Custom Duration"
                : "Standing time"}
            </div>
          </div>

          {/* Progress Bar */}
          {settings.currentSession === "sitting" &&
            timer.status === "running" && (
              <div className="mb-8">
                <div className="w-full bg-muted/50 rounded-full h-0.5">
                  <div
                    className="bg-foreground h-0.5 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${timer.progress}%` }}
                  />
                </div>
              </div>
            )}

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 items-center">
            {settings.currentSession === "sitting" &&
            (timer.status === "idle" || timer.status === "paused") ? (
              <Button
                onClick={timer.start}
                className="gap-2 px-8 py-2.5 rounded-xl"
              >
                <Play className="h-4 w-4" />
                {timer.status === "idle" ? "Start Timer" : "Resume"}
              </Button>
            ) : settings.currentSession === "sitting" ? (
              <Button
                onClick={timer.pause}
                variant="outline"
                className="gap-2 px-8 py-2.5 rounded-xl"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={
                  standing.status === "running"
                    ? standing.pause
                    : standing.start
                }
                className="gap-2 px-8 py-2.5 rounded-xl"
              >
                {standing.status === "running" ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
            )}

            {/* Mode switch placed next to primary control */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleMode}
              className="text-muted-foreground hover:text-foreground"
            >
              {settings.currentSession === "sitting"
                ? "Switch to standing"
                : "Switch to sitting"}
            </Button>

            <div className="flex justify-center gap-2">
              {settings.currentSession === "sitting" &&
                (timer.status === "running" || timer.status === "paused") && (
                  <Button
                    onClick={timer.stop}
                    variant="ghost"
                    size="icon"
                    aria-label="Stop"
                    title="Stop"
                    className="rounded-lg"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              {settings.currentSession === "sitting" ? (
                <Button
                  onClick={timer.reset}
                  variant="ghost"
                  size="icon"
                  aria-label="Reset"
                  title="Reset"
                  className="rounded-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={standing.reset}
                  variant="ghost"
                  size="icon"
                  aria-label="Reset"
                  title="Reset"
                  className="rounded-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? "Hide Settings" : "Settings"}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  Settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customize your timer and notifications
                </p>
              </div>

              {/* Timer Duration */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Timer Duration
                </label>
                <Select
                  value={settings.timerDuration.toString()}
                  onValueChange={handleTimerPresetChange}
                  disabled={timer.status === "running"}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_TIMER_PRESETS.map((preset) => (
                      <SelectItem
                        key={preset.seconds}
                        value={preset.seconds.toString()}
                      >
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speech Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Voice Notifications
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Speak reminder when timer completes
                    </p>
                  </div>
                  <Switch
                    checked={settings.speechEnabled}
                    onCheckedChange={handleSpeechToggle}
                  />
                </div>

                {settings.speechEnabled && speech.isSupported && (
                  <div className="space-y-3 pl-4 border-l border-border/50">
                    <label className="text-sm font-medium text-foreground">
                      Voice Selection
                    </label>
                    <Select
                      value={settings.selectedVoice || ""}
                      onValueChange={handleVoiceChange}
                    >
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue
                          placeholder="Choose a voice"
                          className="truncate max-w-40"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {speech.voices.map((voice) => (
                          <SelectItem
                            key={voice.voiceURI}
                            value={voice.voiceURI}
                            title={voice.name}
                          >
                            <div className="flex items-center justify-between w-full min-w-0 max-w-64">
                              <span className="truncate flex-1 mr-2">
                                {voice.name}
                              </span>
                              <span className="text-muted-foreground text-xs shrink-0">
                                ({voice.lang})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.speechEnabled && !speech.isSupported && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    ⚠️ Voice notifications are not supported in this browser
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion Alert - simplified and calm */}
        {showAlert && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-sm w-full mx-auto text-center shadow-xl animate-in fade-in-0 scale-in-95 duration-300">
              <div className="mb-4">
                <div className="text-3xl mb-2">🧍</div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Time to stand!
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {SESSION_MESSAGES.sitting}
                </p>
              </div>
              <Button
                onClick={dismissAlert}
                className="w-full rounded-lg py-2.5"
              >
                Switch to standing
              </Button>
            </div>
          </div>
        )}

        {/* Developer Testing Panel */}
        <DevPanel
          timer={{
            timeRemaining: timer.timeRemaining,
            status: timer.status,
            setDuration: timer.setDuration,
            start: timer.start,
            pause: timer.pause,
            stop: timer.stop,
            reset: timer.reset,
          }}
          settings={settings}
          onShowAlert={handleShowAlert}
          onHideAlert={handleHideAlert}
        />
      </div>
      {/* End container */}
    </div>
  );
}
