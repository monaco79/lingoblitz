// Last updated: 2025-11-16 21:00
// Added TTS settings section

import React, { useState, useEffect } from 'react';
import { UserSettings, Language, Level, Topic, AzureVoice } from '../types';
import { ALL_LANGUAGES, ALL_LEVELS, ALL_TOPICS, TTS_SAMPLE_SENTENCES } from '../constants';
import CloseIcon from './icons/CloseIcon';
import LoadingSpinner from './icons/LoadingSpinner';
import * as ttsService from '../services/ttsService';

interface SettingsModalProps {
  currentSettings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const [availableVoices, setAvailableVoices] = useState<AzureVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const loadingRef = React.useRef(false);

  // Speed mapping for levels
  const LEVEL_SPEEDS: { [key in Level]: number } = {
    [Level.AbsoluteBeginner]: 0.6,
    [Level.A1]: 0.7,
    [Level.A2]: 0.8,
    [Level.B1]: 0.9,
    [Level.B2]: 1.0,
    [Level.C1]: 1.1
  };

  // Load voices when learning language changes
  useEffect(() => {
    loadVoices();

    // CRITICAL FIX: Listen for voice changes!
    // Mobile browsers often load voices asynchronously AFTER the component mounts.
    // Without this listener, we miss the voices when they finally arrive.
    window.speechSynthesis.onvoiceschanged = () => {
      // Debounce or check if we really need to reload
      if (!loadingRef.current) {
        loadVoices();
      }
    };

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [settings.learningLanguage]);

  // Auto-adjust speed when level changes
  useEffect(() => {
    const newSpeed = LEVEL_SPEEDS[settings.level];
    if (newSpeed !== undefined) {
      console.log(`Level changed to ${settings.level}, adjusting speed to ${newSpeed}`);
      setSettings((prev) => ({
        ...prev,
        tts: {
          ...prev.tts,
          speed: newSpeed
        }
      }));
    }
  }, [settings.level]);

  const loadVoices = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoadingVoices(true);

    // Safety timeout: Stop loading after 5 seconds even if voices don't appear
    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        console.warn('Voice loading timed out');
        setIsLoadingVoices(false);
        loadingRef.current = false;
      }
    }, 5000);

    try {
      const voices = await ttsService.getVoicesForLanguage(settings.learningLanguage);
      setAvailableVoices(voices);

      // Always get the best default voice for the new language
      const defaultVoice = await ttsService.getDefaultVoice(settings.learningLanguage);

      // If current voice is not available for new language, use default
      if (!voices.find(v => v.name === settings.tts.voice) && defaultVoice) {
        updateTTSSettings('voice', defaultVoice);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingVoices(false);
      loadingRef.current = false;
    }
  };

  const updateSettings = <K extends keyof UserSettings,>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateTTSSettings = (key: keyof UserSettings['tts'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      tts: {
        ...prev.tts,
        [key]: value,
      }
    }));
  };

  const toggleInterest = (interest: Topic) => {
    const currentInterests = settings.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    updateSettings('interests', newInterests);
  };

  const playSampleVoice = async () => {
    setIsPlayingSample(true);
    try {
      const sampleText = TTS_SAMPLE_SENTENCES[settings.learningLanguage];
      await ttsService.speak(sampleText, settings.tts.voice, settings.tts.speed);
    } catch (error) {
      console.error('Failed to play sample:', error);
    } finally {
      setIsPlayingSample(false);
    }
  };

  const canSave = settings.nativeLanguage !== settings.learningLanguage &&
    (settings.interests?.length || 0) > 0 &&
    (settings.tts.voice !== '' || availableVoices.length === 0);

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lingoblitz shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <CloseIcon />
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

        <div className="space-y-6">
          <SelectInput label="I speak..." value={settings.nativeLanguage} onChange={(e) => updateSettings('nativeLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
          <SelectInput label="I want to learn..." value={settings.learningLanguage} onChange={(e) => updateSettings('learningLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
          {settings.nativeLanguage === settings.learningLanguage && <p className="text-red-500 dark:text-red-400 text-sm -mt-4">Languages must be different.</p>}

          <SelectInput label="My level is..." value={settings.level} onChange={(e) => updateSettings('level', e.target.value as Level)} options={ALL_LEVELS} />

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-3">My Interests</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleInterest(topic)}
                  className={`p-3 rounded-lingoblitz text-center transition-all duration-200 font-medium ${settings.interests?.includes(topic)
                    ? 'gradient-lingoblitz text-white shadow-md'
                    : 'bg-white hover:bg-gray-50 text-gray-800 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600'
                    }`}
                >
                  {topic}
                </button>
              ))}
            </div>
            {(settings.interests?.length || 0) === 0 && <p className="text-red-500 dark:text-red-400 text-sm mt-2">Please select at least one interest.</p>}
          </div>

          {/* TTS Settings Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-4">Voice Settings</h3>

            {isLoadingVoices ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner className="h-8 w-8 text-sky-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice</label>
                  {availableVoices.length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        value={settings.tts.voice}
                        onChange={(e) => updateTTSSettings('voice', e.target.value)}
                        className="flex-1 min-w-0 max-w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lingoblitz py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white truncate"
                      >
                        {availableVoices.map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.displayName}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={playSampleVoice}
                        disabled={isPlayingSample || !settings.tts.voice}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white p-3 rounded-lingoblitz transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Play sample"
                      >
                        {isPlayingSample ? (
                          <LoadingSpinner className="h-6 w-6" />
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                      No voices found for this language. You can still save your settings, but text-to-speech might not work.
                    </div>
                  )}
                </div>

                {/* Speed Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed: {settings.tts.speed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.1"
                    value={settings.tts.speed}
                    onChange={(e) => updateTTSSettings('speed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Auto-read checkbox */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lingoblitz mb-6">
                  <input
                    type="checkbox"
                    id="autoRead"
                    checked={settings.tts.autoRead}
                    onChange={(e) => updateTTSSettings('autoRead', e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="autoRead" className="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                    Always read out loud
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onSave(settings)}
          disabled={!canSave}
          className="mt-8 gradient-lingoblitz hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 shadow-md"
        >
          Save Changes
        </button>

        {/* Debug Info for Voices - HIDDEN FOR USER */}
        {/* <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <details className="text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">Debug: Available Voices ({availableVoices.length})</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto whitespace-pre-wrap">
              {availableVoices.map(v => `${v.name} (${v.locale})`).join('\n')}
            </pre>
          </details>
        </div> */}
      </div>
    </div>
  );
};

const SelectInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lingoblitz py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default SettingsModal;