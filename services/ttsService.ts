// Last updated: 2025-11-18 19:30
// Added onBoundary callback support for tracking playback position

import { AzureVoice, Language } from '../types';
import { LANGUAGE_TO_LOCALE } from '../constants';

// Track current utterance and state
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isCurrentlyPlaying = false;
let isPaused = false;
let playbackEndCallback: (() => void) | null = null;
let manuallyCancelled = false;

/**
 * Get all available voices as a Promise (handles async voice loading)
 */
const getAllVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });

    window.speechSynthesis.getVoices();
  });
};

/**
 * Get available voices for a specific language
 */
export const getVoicesForLanguage = async (language: Language): Promise<AzureVoice[]> => {
  const locale = LANGUAGE_TO_LOCALE[language];
  const langCode = locale.split('-')[0].toLowerCase();

  try {
    const allVoices = await getAllVoices();

    const languageVoices = allVoices.filter(voice => {
      const voiceLang = voice.lang.replace('_', '-').toLowerCase();
      return voiceLang === langCode || voiceLang.startsWith(langCode + '-');
    });

    const microsoftVoices: SpeechSynthesisVoice[] = [];
    const googleVoices: SpeechSynthesisVoice[] = [];
    const otherVoices: SpeechSynthesisVoice[] = [];

    languageVoices.forEach(voice => {
      const name = voice.name.toLowerCase();
      if (name.includes('microsoft')) {
        microsoftVoices.push(voice);
      } else if (name.includes('google')) {
        googleVoices.push(voice);
      } else {
        otherVoices.push(voice);
      }
    });

    const sortedVoices = [...microsoftVoices, ...googleVoices, ...otherVoices];

    const formattedVoices: AzureVoice[] = sortedVoices.map(voice => ({
      name: voice.name,
      displayName: `${voice.name} (${voice.lang})`,
      locale: voice.lang.replace('_', '-')
    }));

    return formattedVoices;

  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
};

/**
 * Get the default (first available) voice for a language
 */
export const getDefaultVoice = async (language: Language): Promise<string> => {
  try {
    const voices = await getVoicesForLanguage(language);

    if (voices.length === 0) return '';

    const microsoftVoice = voices.find(v => v.name.toLowerCase().includes('microsoft'));
    if (microsoftVoice) return microsoftVoice.name;

    const googleVoice = voices.find(v => v.name.toLowerCase().includes('google'));
    if (googleVoice) return googleVoice.name;

    const applePreferred: { [key: string]: string } = {
      'French': 'Thomas',
      'English': 'Daniel',
      'Spanish': 'Mónica',
      'German': 'Anna',
      'Italian': 'Alice',
      'Portuguese': 'Joana',
      'Japanese': 'Kyoko',
      'Chinese': 'Ting-Ting'
    };

    const preferredName = applePreferred[language];
    if (preferredName) {
      const preferredVoice = voices.find(v => v.name.includes(preferredName));
      if (preferredVoice) return preferredVoice.name;
    }

    return voices[0].name;

  } catch (error) {
    console.error('Error getting default voice:', error);
    return '';
  }
};

/**
 * Stop current speech
 */
export const stopSpeech = (): void => {
  // console.log('🛑 Stopping speech'); // Reduced logs

  manuallyCancelled = true;

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  isCurrentlyPlaying = false;
  isPaused = false;
  playbackEndCallback = null;
  currentUtterance = null;
};

/**
 * Pause current speech
 */
export const pauseSpeech = (): void => {
  if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    isPaused = true;
    isCurrentlyPlaying = false;
  }
};

/**
 * Resume paused speech
 */
export const resumeSpeech = (): void => {
  if (window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    isPaused = false;
    isCurrentlyPlaying = true;
  }
};

/**
 * Synthesize text to speech and play it
 * Added onBoundary callback to track progress
 */
export const speak = async (
  text: string,
  voiceName: string,
  speed: number,
  onPlaybackEnd?: () => void,
  onBoundary?: (charIndex: number) => void
): Promise<void> => {
  if (!isPaused) {
    stopSpeech();
  }

  if (!window.speechSynthesis) {
    throw new Error('Speech Synthesis not supported in this browser');
  }

  isCurrentlyPlaying = true;
  isPaused = false;
  manuallyCancelled = false;
  playbackEndCallback = onPlaybackEnd || null;

  const allVoices = await getAllVoices();
  const selectedVoice = allVoices.find(v => v.name === voiceName);

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.voice = selectedVoice || allVoices[0] || null;
  currentUtterance.rate = speed;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;

  // Attach boundary event listener if callback provided
  if (onBoundary) {
    currentUtterance.onboundary = (event) => {
      // event.charIndex represents the index of the character at the boundary
      onBoundary(event.charIndex);
    };
  }

  return new Promise((resolve, reject) => {
    if (!currentUtterance) {
      reject(new Error('Failed to create utterance'));
      return;
    }

    currentUtterance.onend = () => {
      isCurrentlyPlaying = false;
      isPaused = false;
      if (playbackEndCallback) {
        playbackEndCallback();
      }
      currentUtterance = null;
      resolve();
    };

    currentUtterance.onerror = (event) => {
      if (manuallyCancelled) {
        return;
      }
      console.error('❌ Speech error:', event.error);
      isCurrentlyPlaying = false;
      isPaused = false;
      currentUtterance = null;
      reject(new Error(`Speech error: ${event.error}`));
    };

    window.speechSynthesis.speak(currentUtterance);
  });
};

export const isSpeaking = (): boolean => {
  return isCurrentlyPlaying && window.speechSynthesis?.speaking;
};