import { useState, useEffect, useCallback } from 'react';

export interface SpeechSettings {
  enabled: boolean;
  voice: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVoices = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const voiceList: SpeechVoice[] = availableVoices.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
      }));
      
      // Filter for English voices primarily, but include all if none found
      const englishVoices = voiceList.filter(voice => 
        voice.lang.toLowerCase().startsWith('en')
      );
      
      setVoices(englishVoices.length > 0 ? englishVoices : voiceList);
    };

    // Voices might not be immediately available
    if (speechSynthesis.getVoices().length > 0) {
      updateVoices();
    } else {
      speechSynthesis.addEventListener('voiceschanged', updateVoices);
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  // Check for speech synthesis support
  useEffect(() => {
    const checkSupport = () => {
      if ('speechSynthesis' in window) {
        setIsSupported(true);
        loadVoices();
      } else {
        setIsSupported(false);
        setError('Speech synthesis is not supported in this browser');
      }
    };

    checkSupport();
  }, [loadVoices]);

  const speak = useCallback((
    text: string, 
    settings: SpeechSettings = {
      enabled: true,
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
    }
  ) => {
    if (!isSupported || !settings.enabled) return;

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Small delay to ensure cancel completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find and set the voice
        if (settings.voice) {
          const selectedVoice = speechSynthesis.getVoices().find(
            voice => voice.voiceURI === settings.voice || voice.name === settings.voice
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        // Set speech parameters
        utterance.rate = Math.max(0.1, Math.min(2, settings.rate));
        utterance.pitch = Math.max(0, Math.min(2, settings.pitch));
        utterance.volume = Math.max(0, Math.min(1, settings.volume));

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
          console.log('Speech started:', text);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          console.log('Speech ended');
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          setError(`Speech error: ${event.error}`);
          console.error('Speech synthesis error:', event);
        };

        // Speak
        console.log('Speaking:', text);
        speechSynthesis.speak(utterance);
      }, 100);

    } catch (err) {
      setError(`Failed to speak: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Speech synthesis error:', err);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const getDefaultVoice = useCallback((): string | null => {
    if (voices.length === 0) return null;
    
    // Try to find a good default English voice
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira',
      'Alex',
      'Samantha',
    ];

    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferred));
      if (voice) return voice.voiceURI;
    }

    // Return first English voice or first available voice
    return voices[0]?.voiceURI || null;
  }, [voices]);

  return {
    isSupported,
    voices,
    isSpeaking,
    error,
    speak,
    stop,
    getDefaultVoice,
  };
}