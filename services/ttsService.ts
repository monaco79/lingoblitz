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
      // console.log(`✅ Voices loaded: ${v.length}`);
      resolve(v);
    };

    // 1. Event Listener
    window.speechSynthesis.onvoiceschanged = () => {
      finish(window.speechSynthesis.getVoices());
    };

    // 2. Polling (every 200ms for 5s)
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts++;
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        clearInterval(intervalId);
        finish(v);
      }
      // Stop polling after 5s
      if (attempts > 25) {
        clearInterval(intervalId);
      }
    }, 200);

    // 3. Timeout (5s fallback)
    setTimeout(() => {
      clearInterval(intervalId);
      finish(window.speechSynthesis.getVoices()); // Return whatever we have, even if empty
    }, 5000);
  });
};

/**
 * Get available voices for a specific language
 */
/**
 * Get available voices for a specific language
 * Adapted from KimChi logic to prioritize high-quality voices
 */
export const getVoicesForLanguage = async (language: Language): Promise<AzureVoice[]> => {
  const locale = LANGUAGE_TO_LOCALE[language];
  const langCode = locale.split('-')[0]; // e.g. "en", "es"

  try {
    const allVoices = await getAllVoices();

    // 1. Filter by language code (e.g. all "es-*" voices)
    const languageVoices = allVoices.filter(voice =>
      voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
    );

    // 2. Sort voices by quality (Microsoft > Google > Natural > Others)
    languageVoices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aIsMicrosoft = aName.includes('microsoft');
      const bIsMicrosoft = bName.includes('microsoft');
      const aIsGoogle = aName.includes('google') || aName.includes('chrome');
      const bIsGoogle = bName.includes('google') || bName.includes('chrome');
      const aIsNatural = aName.includes('natural') || !a.localService; // !localService often implies cloud/natural
      const bIsNatural = bName.includes('natural') || !b.localService;

      if (aIsMicrosoft && !bIsMicrosoft) return -1;
      if (!aIsMicrosoft && bIsMicrosoft) return 1;

      if (aIsGoogle && !bIsGoogle) return -1;
      if (!aIsGoogle && bIsGoogle) return 1;

      if (aIsNatural && !bIsNatural) return -1;
      if (!aIsNatural && bIsNatural) return 1;

      return aName.localeCompare(bName);
    });

    // 3. Format for app usage
    const formattedVoices: AzureVoice[] = languageVoices.map(voice => ({
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
 * Since getVoicesForLanguage sorts by quality, we can just take the first one.
 */
export const getDefaultVoice = async (language: Language): Promise<string> => {
  try {
    const voices = await getVoicesForLanguage(language);

    if (voices.length === 0) return '';

    // KimChi logic: Check for specific high-quality keywords if the sort didn't catch them
    // (Though our sort above should have handled this, it's good to be safe)
    const microsoftVoice = voices.find(v =>
      v.name.toLowerCase().includes('microsoft') ||
      v.name.toLowerCase().includes('natural')
    );
    if (microsoftVoice) return microsoftVoice.name;

    const googleVoice = voices.find(v =>
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('chrome')
    );
    if (googleVoice) return googleVoice.name;

    // Fallback to the first voice (which is already sorted by best guess)
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