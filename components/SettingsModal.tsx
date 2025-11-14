import React, { useState } from 'react';
import { UserSettings, Language, Level, Topic } from '../types';
import { ALL_LANGUAGES, ALL_LEVELS, ALL_TOPICS } from '../constants';
import CloseIcon from './icons/CloseIcon';

interface SettingsModalProps {
  currentSettings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);

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
  
  const canSave = settings.nativeLanguage !== settings.learningLanguage && (settings.interests?.length || 0) > 0;

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-6">Settings</h2>

        <div className="space-y-6">
          <SelectInput label="I speak..." value={settings.nativeLanguage} onChange={(e) => updateSettings('nativeLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
          <SelectInput label="I want to learn..." value={settings.learningLanguage} onChange={(e) => updateSettings('learningLanguage', e.target.value as Language)} options={ALL_LANGUAGES} />
          {settings.nativeLanguage === settings.learningLanguage && <p className="text-red-400 -mt-4">Languages must be different.</p>}

          <SelectInput label="My level is..." value={settings.level} onChange={(e) => updateSettings('level', e.target.value as Level)} options={ALL_LEVELS} />

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-3">My Interests</h3>
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
             {(settings.interests?.length || 0) === 0 && <p className="text-red-400 mt-2">Please select at least one interest.</p>}
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button onClick={() => onSave(settings)} disabled={!canSave} className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Save Changes
          </button>
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


export default SettingsModal;