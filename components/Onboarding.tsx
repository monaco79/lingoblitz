import React, { useState } from 'react';
import { UserSettings, Language, Level, Topic } from '../types';
import { ALL_LANGUAGES, ALL_LEVELS, ALL_TOPICS } from '../constants';

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
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const updateSettings = <K extends keyof UserSettings,>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: Topic) => {
    const currentInterests = settings.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    updateSettings('interests', newInterests);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return settings.nativeLanguage && settings.learningLanguage && settings.nativeLanguage !== settings.learningLanguage;
      case 2:
        return !!settings.level;
      case 3:
        return (settings.interests?.length || 0) > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-2">Welcome to LingoBlitz!</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Let's set up your learning journey.</p>
            <div className="space-y-4">
              <SelectInput label="I speak..." value={settings.nativeLanguage!} onChange={(e) => updateSettings('nativeLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
              <SelectInput label="I want to learn..." value={settings.learningLanguage!} onChange={(e) => updateSettings('learningLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
            </div>
            {settings.nativeLanguage === settings.learningLanguage && <p className="text-red-400 mt-2">Native and learning languages must be different.</p>}
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-6">What is your current level?</h2>
            <div className="space-y-4">
                <SelectInput label="My level in my learning language is..." value={settings.level!} onChange={(e) => updateSettings('level', e.target.value as Level)} options={ALL_LEVELS} />
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-6">What are you interested in?</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Select at least one to personalize your articles.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleInterest(topic)}
                  className={`p-3 rounded-lg text-center transition-all duration-200 ${
                    settings.interests?.includes(topic)
                      ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
        {renderStep()}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button onClick={handleBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors dark:bg-gray-600 dark:hover:bg-gray-500">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={handleNext} disabled={!canProceed()} className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              Next
            </button>
          ) : (
            <button onClick={() => onComplete(settings as UserSettings)} disabled={!canProceed()} className="bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

export default Onboarding;