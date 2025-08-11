import { useState } from 'react';
import { Bug, FastForward, Volume2, Bell, RotateCcw, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useSpeech } from '@/hooks/useSpeech';
import { NOTIFICATION_MESSAGE } from '@/types';
import type { AppSettings } from '@/types';

interface DevPanelProps {
  timer: {
    timeRemaining: number;
    status: 'idle' | 'running' | 'paused' | 'completed';
    setDuration: (seconds: number) => void;
    start: () => void;
    pause: () => void;
    stop: () => void;
    reset: () => void;
  };
  settings: AppSettings;
  onShowAlert: () => void;
  onHideAlert: () => void;
}

export function DevPanel({ timer, settings, onShowAlert, onHideAlert }: DevPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [testMessage, setTestMessage] = useState<string>(NOTIFICATION_MESSAGE);
  const speech = useSpeech();

  const fastForwardOptions = [
    { label: '10 seconds', seconds: 10 },
    { label: '5 seconds', seconds: 5 },
    { label: '3 seconds', seconds: 3 },
    { label: '1 second', seconds: 1 },
  ];

  const handleFastForward = (seconds: number) => {
    timer.setDuration(seconds);
    if (timer.status !== 'running') {
      timer.start();
    }
  };

  const handleTestVoice = () => {
    if (speech.isSupported) {
      speech.speak(testMessage, {
        enabled: true,
        voice: settings.selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
      });
    }
  };

  const handleTestAlert = () => {
    onShowAlert();
    // Auto-hide after 3 seconds for testing
    setTimeout(() => onHideAlert(), 3000);
  };

  const handleForceComplete = () => {
    timer.setDuration(1);
    timer.start();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="gap-2 bg-background/80 backdrop-blur-sm border-orange-500/50 text-orange-600 hover:bg-orange-50"
        >
          <Bug className="h-4 w-4" />
          Dev Tools
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="border-orange-500/50 bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Developer Testing Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Test timer, voice, and alerts
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timer Controls */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timer Testing
            </h4>
            
            <div className="flex gap-2">
              <Button
                onClick={handleForceComplete}
                size="sm"
                variant="outline"
                className="gap-1 flex-1"
              >
                <FastForward className="h-3 w-3" />
                Force Complete
              </Button>
              <Button
                onClick={timer.reset}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Fast Forward Timer:</label>
              <div className="grid grid-cols-2 gap-2">
                {fastForwardOptions.map((option) => (
                  <Button
                    key={option.seconds}
                    onClick={() => handleFastForward(option.seconds)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Testing */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Voice Testing
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Speech Supported:</span>
                <span className={`text-xs px-2 py-0.5 rounded ${speech.isSupported ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {speech.isSupported ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs">Is Speaking:</span>
                <span className={`text-xs px-2 py-0.5 rounded ${speech.isSpeaking ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {speech.isSpeaking ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">Voices Available:</span>
                <span className="text-xs text-muted-foreground">
                  {speech.voices.length}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Test Message:</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="Enter test message"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestVoice}
                size="sm"
                variant="outline"
                className="gap-1 flex-1"
                disabled={!speech.isSupported}
              >
                <Volume2 className="h-3 w-3" />
                Test Voice
              </Button>
              <Button
                onClick={speech.stop}
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={!speech.isSpeaking}
              >
                Stop
              </Button>
            </div>

            {speech.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {speech.error}
              </div>
            )}
          </div>

          {/* Alert Testing */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Alert Testing
            </h4>
            
            <Button
              onClick={handleTestAlert}
              size="sm"
              variant="outline"
              className="gap-1 w-full"
            >
              <Bell className="h-3 w-3" />
              Test Alert (3s)
            </Button>
          </div>

          {/* Current State */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current State
            </h4>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Timer Status:</span>
                <span className="font-mono">{timer.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-mono">{timer.timeRemaining}s</span>
              </div>
              <div className="flex justify-between">
                <span>Speech Enabled:</span>
                <span className="font-mono">{settings.speechEnabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Voice:</span>
                <span className="font-mono text-xs truncate max-w-24" title={settings.selectedVoice || 'None'}>
                  {settings.selectedVoice ? speech.voices.find(v => v.voiceURI === settings.selectedVoice)?.name?.substring(0, 15) || 'Unknown' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}