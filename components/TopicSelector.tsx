// Last updated: 2025-11-15 18:30
// Design update: New gradient, Poppins font, 20px rounded corners
// Removed RefreshIcon from New Proposals button

import React, { useState, useEffect } from 'react';

interface TopicSelectorProps {
  proposals: string[];
  onBlitz: (topic: string) => void;
  onNewProposals: () => void;
  isBlitzing: boolean;
  onWordClick: (word: string, event: React.MouseEvent<HTMLSpanElement>) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ proposals, onBlitz, onNewProposals, isBlitzing, onWordClick }) => {
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

  const cleanWord = (word: string): string => {
    return word.trim().replace(/^['".,!?;:]+|['".,!?;:]+$/g, '').toLowerCase();
  };

  const makeWordsClickable = (text: string) => {
    const words = text.split(/(\s+|[.,!?;:"()])/).filter(Boolean);

    return words.map((word, arrayIndex) => {
      const cleaned = cleanWord(word);
      const isClickable = /\w/.test(cleaned);

      return (
        <span
          key={`word-${arrayIndex}`}
          className={`${isClickable ? "cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-100" : ""}`}
          onClick={(e) => {
            if (isClickable) {
              e.stopPropagation(); // Prevent selecting the topic
              onWordClick(cleaned, e);
            }
          }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lingoblitz shadow-lg flex flex-col gap-6">
      {/* Badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Personalized Learning
        </span>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center">Choose Your Next Blitz!</h2>
      <p className="text-center text-gray-600 dark:text-gray-400">Pick a topic or create your own learning adventure</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {proposals.map((p, i) => (
          <button
            key={i}
            onClick={() => handleProposalClick(p)}
            className={`p-4 rounded-lingoblitz text-left transition-all duration-200 font-medium min-h-[100px] flex items-center ${selectedTopic === p && !customTopic
              ? 'gradient-lingoblitz text-white shadow-xl scale-[1.01]'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-gray-600'
              }`}
          >
            <span className="w-full">{makeWordsClickable(p)}</span>
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center my-2">
        <div className="absolute left-0 w-full h-px bg-gray-200 dark:bg-gray-700"></div>
        <span className="relative z-10 px-3 bg-white dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-500">or</span>
      </div>

      <div className="relative mb-2">
        <input
          type="text"
          value={customTopic}
          onChange={(e) => {
            setCustomTopic(e.target.value);
            if (e.target.value) setSelectedTopic('');
          }}
          placeholder="Type any topic of your choice here..."
          className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lingoblitz py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleBlitz}
          disabled={isBlitzing || (!selectedTopic && !customTopic.trim())}
          className="flex-1 gradient-lingoblitz hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg shadow-md whitespace-nowrap"
        >
          {isBlitzing ? 'Blitzing...' : "Let's Blitz!"}
        </button>
        <button
          onClick={onNewProposals}
          disabled={isBlitzing}
          className="bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          New Proposals
        </button>
      </div>
    </div>
  );
};

export default TopicSelector;