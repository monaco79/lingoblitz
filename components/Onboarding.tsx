// Last updated: 2025-11-16 21:25
// Fixed syntax error in step 3

import React, { useState, useEffect } from 'react';
import { UserSettings, Language, Level, Topic, AzureVoice } from '../types';
import { ALL_LANGUAGES, ALL_LEVELS, ALL_TOPICS, LEVEL_TTS_SPEEDS, TTS_SAMPLE_SENTENCES } from '../constants';
import * as ttsService from '../services/ttsService';
import LoadingSpinner from './icons/LoadingSpinner';

interface OnboardingProps {
  onComplete: (settings: UserSettings) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    nativeLanguage: Language.English,
    learningLanguage: Language.Spanish,
    level: Level.A2,
    interests: [],
    tts: {
      voice: '',
      speed: 0.8,
      autoRead: false,
    }
  });

  // TTS-specific state
  const [availableVoices, setAvailableVoices] = useState<AzureVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Load voices when reaching TTS step
  useEffect(() => {
    if (step === 4 && settings.learningLanguage) {
      loadVoices();
    }
  }, [step, settings.learningLanguage]);

  const loadVoices = async () => {
    if (!settings.learningLanguage) return;

    setIsLoadingVoices(true);
    try {
      const voices = await ttsService.getVoicesForLanguage(settings.learningLanguage);
      setAvailableVoices(voices);

      // Auto-select first voice if none selected
      if (!settings.tts?.voice && voices.length > 0) {
        updateTTSSettings('voice', voices[0].name);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const updateSettings = <K extends keyof UserSettings,>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateTTSSettings = (key: keyof UserSettings['tts'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      tts: {
        ...prev.tts!,
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
    if (!settings.learningLanguage || !settings.tts?.voice) return;

    setIsPlayingSample(true);
    try {
      const sampleText = TTS_SAMPLE_SENTENCES[settings.learningLanguage];
      await ttsService.speak(sampleText, settings.tts.voice, settings.tts.speed, settings.learningLanguage);
    } catch (error) {
      console.error('Failed to play sample:', error);
    } finally {
      setIsPlayingSample(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return settings.nativeLanguage && settings.learningLanguage && settings.nativeLanguage !== settings.learningLanguage;
      case 2:
        return !!settings.level;
      case 3:
        return (settings.interests?.length || 0) > 0;
      case 4:
        // Allow if voice is selected OR if no voices are available (skip)
        return !!settings.tts?.voice || availableVoices.length === 0;
      default:
        return false;
    }
  };

  // Update default speed when level changes
  useEffect(() => {
    if (settings.level) {
      const defaultSpeed = LEVEL_TTS_SPEEDS[settings.level];
      updateTTSSettings('speed', defaultSpeed);
    }
  }, [settings.level]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to <span className="text-gradient-lingoblitz">LingoBlitz</span>!</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Let's set up your learning journey.</p>
            <div className="space-y-4">
              <SelectInput label="I speak..." value={settings.nativeLanguage!} onChange={(e) => updateSettings('nativeLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
              <SelectInput label="I want to learn..." value={settings.learningLanguage!} onChange={(e) => updateSettings('learningLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
            </div>
            {settings.nativeLanguage === settings.learningLanguage && <p className="text-red-500 dark:text-red-400 text-sm mt-2">Native and learning languages must be different.</p>}
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">What is your current level?</h2>
            <div className="space-y-4">
              <SelectInput label="My level in my learning language is..." value={settings.level!} onChange={(e) => updateSettings('level', e.target.value as Level)} options={ALL_LEVELS} />
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">What are you interested in?</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Select at least one to personalize your articles.</p>
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
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Voice Settings</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Choose how you want to hear {settings.learningLanguage}.</p>

            {isLoadingVoices ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner className="h-8 w-8 text-sky-500" />
              </div>
            ) : availableVoices.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lingoblitz border border-yellow-200 dark:border-yellow-700">
                <p className="text-yellow-800 dark:text-yellow-200 text-center">
                  No voices found for this language on your device. You can still proceed, but text-to-speech might not work.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice</label>
                  <div className="flex gap-2">
                    <select
                      value={settings.tts?.voice || ''}
                      onChange={(e) => updateTTSSettings('voice', e.target.value)}
                      className="flex-1 min-w-0 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lingoblitz py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white truncate"
                    >
                      {availableVoices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.displayName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={playSampleVoice}
                      disabled={isPlayingSample || !settings.tts?.voice}
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
                </div>

                {/* Speed Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed: {settings.tts?.speed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.1"
                    value={settings.tts?.speed || 1.0}
                    onChange={(e) => updateTTSSettings('speed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Auto-read checkbox */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lingoblitz">
                  <input
                    type="checkbox"
                    id="autoRead"
                    checked={settings.tts?.autoRead || false}
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lingoblitz shadow-2xl">
        {renderStep()}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200"
            >
              Back
            </button>
          ) : <div />}
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gradient-lingoblitz hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 shadow-md"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => onComplete(settings as UserSettings)}
              disabled={!canProceed()}
              className="gradient-lingoblitz hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 shadow-md"
            >
              Start Learning!
            </button>
          )}
        </div>
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

export default Onboarding;