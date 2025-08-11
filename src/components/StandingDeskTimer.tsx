import { useState, useEffect } from "react";
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
  const speech = useSpeech();

  // Handle timer completion and session cycling
  useEffect(() => {
    if (timer.status === "completed") {
      setShowAlert(true);

      const currentMessage = SESSION_MESSAGES[settings.currentSession];

      // Try speech synthesis with a small delay to ensure it works
      if (settings.speechEnabled && speech.isSupported) {
        setTimeout(() => {
          speech.speak(currentMessage, {
            enabled: settings.speechEnabled,
            voice: settings.selectedVoice,
            rate: settings.speechRate,
            pitch: settings.speechPitch,
            volume: settings.speechVolume,
          });
        }, 500);
      }

      // Hide alert after 15 seconds (longer to ensure speech completes)
      const alertTimer = setTimeout(() => {
        setShowAlert(false);
        timer.reset();
      }, 15000);

      return () => clearTimeout(alertTimer);
    }
  }, [timer.status, timer.reset, settings, speech]);

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
    timer.reset();
    
    // Cycle to the next session type
    setSettings(prev => ({
      ...prev,
      currentSession: prev.currentSession === 'sitting' ? 'standing' : 'sitting',
      sessionCount: prev.sessionCount + 1,
    }));
  };

  const handleShowAlert = () => {
    setShowAlert(true);
  };

  const handleHideAlert = () => {
    setShowAlert(false);
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
          <div className="flex items-center justify-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              settings.currentSession === 'sitting'
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              💺 Sitting
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              settings.currentSession === 'standing'
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              🧍 Standing
            </div>
          </div>
          {settings.sessionCount > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Session #{settings.sessionCount + 1}
            </div>
          )}
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
              {timer.status === "idle" && `Ready to ${settings.currentSession === 'sitting' ? 'sit' : 'stand'}`}
              {timer.status === "running" && `${settings.currentSession === 'sitting' ? 'Sitting' : 'Standing'} session`}
              {timer.status === "paused" && "Paused"}
              {timer.status === "completed" && `Time to ${settings.currentSession === 'sitting' ? 'stand' : 'sit'}!`}
            </div>
          </div>

          {/* Large Timer Display */}
          {/* Uses tabular-nums for consistent character width */}
          <div className="mb-8">
            <div className="text-6xl sm:text-7xl font-extralight tabular-nums tracking-tighter text-foreground mb-4 leading-none">
              {timer.formatTime}
            </div>
            <div className="text-sm text-muted-foreground">
              {DEFAULT_TIMER_PRESETS.find(
                (p) => p.seconds === settings.timerDuration
              )?.label || "Custom Duration"}
            </div>
          </div>

          {/* Progress Bar */}
          {timer.status === "running" && (
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
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {timer.status === "idle" || timer.status === "paused" ? (
              <Button
                onClick={timer.start}
                className="gap-2 px-8 py-2.5 rounded-xl"
              >
                <Play className="h-4 w-4" />
                {timer.status === "idle" ? "Start Timer" : "Resume"}
              </Button>
            ) : (
              <Button
                onClick={timer.pause}
                variant="outline"
                className="gap-2 px-8 py-2.5 rounded-xl"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            <div className="flex justify-center gap-2">
              {(timer.status === "running" || timer.status === "paused") && (
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
                <div className="text-3xl mb-2">
                  {settings.currentSession === 'sitting' ? '🧍' : '💺'}
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  {settings.currentSession === 'sitting' ? 'Time to stand!' : 'Time to sit!'}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {SESSION_MESSAGES[settings.currentSession]}
                </p>
              </div>
              <Button
                onClick={dismissAlert}
                className="w-full rounded-lg py-2.5"
              >
                Start {settings.currentSession === 'sitting' ? 'Standing' : 'Sitting'} Session
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
