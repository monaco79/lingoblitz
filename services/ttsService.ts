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
/**
 * Get all available voices as a Promise (handles async voice loading)
 * Includes polling and timeout for robust mobile support
 */
const getAllVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Mobile browsers are tricky. We'll use a combination of event listener,
    // polling, and a timeout to ensure we return SOMETHING.

    let resolved = false;
    const finish = (v: SpeechSynthesisVoice[]) => {
      if (resolved) return;
      resolved = true;
      resolve(v);
    };

    // 1. Event Listener
    window.speechSynthesis.onvoiceschanged = () => {
      finish(window.speechSynthesis.getVoices());
    };

    // 2. Polling (every 100ms for 2s)
    const intervalId = setInterval(() => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        clearInterval(intervalId);
        finish(v);
      }
    }, 100);

    // 3. Timeout (3s fallback)
    setTimeout(() => {
      clearInterval(intervalId);
      finish(window.speechSynthesis.getVoices()); // Return whatever we have, even if empty
    }, 3000);
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
      // Normalize voice language: lower case, replace underscores with hyphens
      const voiceLang = voice.lang.toLowerCase().replace('_', '-');

      // Check for exact match or prefix match (e.g. "en-us" starts with "en-")
      // Also check if the voice language STARTS with the target language code (e.g. "en" matches "en-US")
      return voiceLang === langCode ||
        voiceLang.startsWith(langCode + '-') ||
        voiceLang.startsWith(langCode);
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
  language?: Language,
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

  // Set voice if found
  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
  }

  // CRITICAL FIX for Mobile:
  // Always set the language explicitly. 
  // If a specific voice is selected, use its lang.
  // If not (or if we want to force the target language), use the requested language.
  // This prevents Android from falling back to the system default language (e.g. German)
  // when it should be speaking Spanish.
  if (language) {
    currentUtterance.lang = LANGUAGE_TO_LOCALE[language];
  } else if (selectedVoice) {
    currentUtterance.lang = selectedVoice.lang;
  }

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