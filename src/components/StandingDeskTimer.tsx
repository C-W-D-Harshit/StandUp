import { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { useTimer } from '@/hooks/useTimer';
import { useSpeech } from '@/hooks/useSpeech';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_TIMER_PRESETS, DEFAULT_SETTINGS, NOTIFICATION_MESSAGE } from '@/types';
import type { AppSettings } from '@/types';

export function StandingDeskTimer() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('standing-desk-timer-settings', DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const timer = useTimer(settings.timerDuration);
  const speech = useSpeech();

  // Handle timer completion
  useEffect(() => {
    if (timer.status === 'completed') {
      setShowAlert(true);
      
      if (settings.speechEnabled && speech.isSupported) {
        speech.speak(NOTIFICATION_MESSAGE, {
          enabled: settings.speechEnabled,
          voice: settings.selectedVoice,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          volume: settings.speechVolume,
        });
      }

      // Hide alert after 10 seconds
      const alertTimer = setTimeout(() => {
        setShowAlert(false);
        timer.reset();
      }, 10000);

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
        setSettings(prev => ({ ...prev, selectedVoice: defaultVoice }));
      }
    }
  }, [speech.voices, speech.getDefaultVoice, settings.selectedVoice, setSettings]);

  const handleTimerPresetChange = (value: string) => {
    const preset = DEFAULT_TIMER_PRESETS.find(p => p.seconds.toString() === value);
    if (preset) {
      setSettings(prev => ({ ...prev, timerDuration: preset.seconds }));
    }
  };

  const handleVoiceChange = (value: string) => {
    setSettings(prev => ({ ...prev, selectedVoice: value }));
  };

  const handleSpeechToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, speechEnabled: enabled }));
  };

  const dismissAlert = () => {
    setShowAlert(false);
    timer.reset();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Standing Desk Timer
          </h1>
          <p className="text-muted-foreground">
            Take regular breaks to improve your health and productivity
          </p>
        </div>

        {/* Main Timer Card */}
        <Card className="relative">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-medium">
              {timer.status === 'idle' && 'Ready to Start'}
              {timer.status === 'running' && 'Timer Running'}
              {timer.status === 'paused' && 'Timer Paused'}
              {timer.status === 'completed' && 'Time to Stand!'}
            </CardTitle>
            {timer.status !== 'completed' && (
              <CardDescription>
                {DEFAULT_TIMER_PRESETS.find(p => p.seconds === settings.timerDuration)?.label || 'Custom Duration'}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Large Timer Display */}
            <div className="text-center">
              <div className="text-6xl font-light tabular-nums tracking-wider text-foreground mb-2">
                {timer.formatTime}
              </div>
              {timer.status === 'running' && (
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${timer.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-3">
              {timer.status === 'idle' || timer.status === 'paused' ? (
                <Button onClick={timer.start} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  {timer.status === 'idle' ? 'Start' : 'Resume'}
                </Button>
              ) : (
                <Button onClick={timer.pause} size="lg" variant="secondary" className="gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}

              {(timer.status === 'running' || timer.status === 'paused') && (
                <Button onClick={timer.stop} size="lg" variant="outline" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}

              <Button onClick={timer.reset} size="lg" variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Toggle */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
              <CardDescription>Customize your timer and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timer Duration</label>
                <Select
                  value={settings.timerDuration.toString()}
                  onValueChange={handleTimerPresetChange}
                  disabled={timer.status === 'running'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_TIMER_PRESETS.map((preset) => (
                      <SelectItem key={preset.seconds} value={preset.seconds.toString()}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speech Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Voice Notifications</label>
                    <p className="text-xs text-muted-foreground">
                      Speak reminder when timer completes
                    </p>
                  </div>
                  <Switch
                    checked={settings.speechEnabled}
                    onCheckedChange={handleSpeechToggle}
                  />
                </div>

                {settings.speechEnabled && speech.isSupported && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Voice</label>
                    <Select
                      value={settings.selectedVoice || ''}
                      onValueChange={handleVoiceChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {speech.voices.map((voice) => (
                          <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.speechEnabled && !speech.isSupported && (
                  <p className="text-xs text-muted-foreground">
                    Voice notifications are not supported in this browser
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Alert */}
        {showAlert && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Alert className="max-w-md mx-auto border-primary bg-card">
              <AlertDescription className="text-center space-y-4">
                <div className="text-2xl font-medium text-foreground">
                  ⏰ Time to Stand Up!
                </div>
                <p className="text-muted-foreground">
                  Take a break from sitting and move around for a few minutes.
                </p>
                <Button onClick={dismissAlert} className="w-full">
                  Got it!
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}