import React, { useState, useEffect } from 'react';
import RefreshIcon from './icons/RefreshIcon';

interface TopicSelectorProps {
  proposals: string[];
  onBlitz: (topic: string) => void;
  onNewProposals: () => void;
  isBlitzing: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ proposals, onBlitz, onNewProposals, isBlitzing }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    if (proposals.length > 0 && !customTopic) {
      setSelectedTopic(proposals[0]);
    }
  }, [proposals, customTopic]);

  const handleBlitz = () => {
    const topicToBlitz = customTopic.trim() || selectedTopic;
    if (topicToBlitz) {
      onBlitz(topicToBlitz);
    }
  };

  const handleProposalClick = (proposal: string) => {
    setSelectedTopic(proposal);
    setCustomTopic('');
  };

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 text-center">Choose Your Next Blitz!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proposals.map((p, i) => (
          <button
            key={i}
            onClick={() => handleProposalClick(p)}
            className={`p-4 rounded-lg text-left transition-all duration-200 h-full ${
              selectedTopic === p && !customTopic
                ? 'bg-sky-600 text-white ring-2 ring-sky-400 shadow-lg'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="relative text-center text-gray-500 dark:text-gray-400">
        <span className="inline-block px-2 bg-white dark:bg-gray-800">or</span>
        <div className="absolute left-0 top-1/2 w-full h-px bg-gray-200 dark:bg-gray-700 -z-10"></div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={customTopic}
          onChange={(e) => {
            setCustomTopic(e.target.value);
            if (e.target.value) setSelectedTopic('');
          }}
          placeholder="Type any topic of your choice here..."
          className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleBlitz}
          disabled={isBlitzing || (!selectedTopic && !customTopic.trim())}
          className="flex-grow bg-sky-600 hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg"
        >
          {isBlitzing ? 'Blitzing...' : "Let's Blitz!"}
        </button>
        <button
          onClick={onNewProposals}
          disabled={isBlitzing}
          className="flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshIcon />
          New Proposals
        </button>
      </div>
    </div>
  );
};

export default TopicSelector;