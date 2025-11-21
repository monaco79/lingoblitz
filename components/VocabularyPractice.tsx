// Last updated: 2025-11-15 18:15
// Design update: Gradient flashcard, white buttons with red/green borders, progress bar

import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem, TTSSettings, Language } from '../types';
import * as ttsService from '../services/ttsService';
import Confetti from './Confetti';

interface VocabularyPracticeProps {
  vocabulary: VocabularyItem[];
  onComplete: () => void;
  learningLanguage: Language;
  ttsSettings: TTSSettings;
}

const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({ vocabulary, onComplete, learningLanguage, ttsSettings }) => {
  const [wordsToPractice, setWordsToPractice] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalPracticedWords, setTotalPracticedWords] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      ttsService.stopSpeech();
    };
  }, []);

  useEffect(() => {
    // Shuffle the initial vocabulary for variety and reset state on new vocab list
    setWordsToPractice([...vocabulary].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowConfetti(false);
    setTotalPracticedWords(vocabulary.length);
  }, [vocabulary]);

  // Auto-read logic
  useEffect(() => {
    const currentWord = wordsToPractice[currentIndex];
    if (currentWord && ttsSettings?.autoRead && !showConfetti) {
      // Stop any previous speech before starting new one
      ttsService.stopSpeech();

      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        if (isMounted.current) {
          ttsService.speak(
            currentWord.word,
            ttsSettings.voice,
            ttsSettings.speed,
            learningLanguage as any, // Cast to Language enum type
            () => setIsPlaying(false)
          );
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, wordsToPractice, ttsSettings, showConfetti]);

  const handleKnownWord = () => {
    // If this is the last word, trigger confetti and finish
    if (wordsToPractice.length === 1) {
      setShowConfetti(true);
      setTimeout(() => {
        onComplete();
      }, 4000); // Allow time for confetti animation before completing
      return;
    }

    const remainingWords = wordsToPractice.filter((_, index) => index !== currentIndex);
    setWordsToPractice(remainingWords);

    // Ensure the new index is valid for the smaller array
    setCurrentIndex(prevIndex => prevIndex % remainingWords.length);
    setIsFlipped(false);
  };

  const handleUnknownWord = () => {
    // Go to the next word in the current list
    setCurrentIndex(prevIndex => (prevIndex + 1) % wordsToPractice.length);
    setIsFlipped(false);
  };

  if (wordsToPractice.length === 0 && !showConfetti) {
    // This handles the case where there's no vocabulary to start with.
    return (
      <div className="w-full max-w-4xl p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lingoblitz shadow-lg flex flex-col items-center gap-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">No vocabulary to practice.</p>
        <button onClick={onComplete} className="bg-white hover:bg-gray-50 border-2 border-green-500 text-gray-800 font-semibold py-2 px-6 rounded-lingoblitz transition-all">
          Start New Blitz
        </button>
      </div>
    );
  }

  const currentItem = wordsToPractice.length > 0 ? wordsToPractice[currentIndex] : null;
  const isLastWordInRound = wordsToPractice.length === 1;
  const progress = totalPracticedWords > 0 ? ((totalPracticedWords - wordsToPractice.length) / totalPracticedWords) * 100 : 0;

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lingoblitz shadow-lg flex flex-col items-center gap-6 relative">
      {showConfetti && <Confetti />}

      {/* Success message shown during confetti */}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lingoblitz shadow-2xl border-4 border-green-500 max-w-md">
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4 text-center">
              🎉 Awesome! 🎉
            </h2>
            <p className="text-xl text-gray-800 dark:text-gray-200 text-center">
              You have practiced <span className="font-bold text-green-600 dark:text-green-400">{totalPracticedWords}</span> word{totalPracticedWords !== 1 ? 's' : ''} in <span className="font-bold text-purple-600 dark:text-purple-400">{learningLanguage}</span>!
            </p>
          </div>
        </div>
      )}

      {/* Main practice UI, hidden during confetti */}
      <div className={`w-full flex flex-col items-center gap-6 ${showConfetti ? 'invisible' : 'visible'}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Vocabulary Practice</h2>

        {currentItem && (
          <>
            <div
              key={`${currentItem.word}-${currentIndex}`}
              className="w-full h-64 cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className="relative w-full h-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front: Shows WORD in learning language with gradient background */}
                <div
                  className="absolute w-full h-full flex flex-col items-center justify-center gradient-lingoblitz rounded-lingoblitz p-6 text-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-4xl md:text-5xl font-bold text-white mb-2">{currentItem.word}</span>
                  <span className="text-sm text-white/80 mt-4">Click to reveal</span>
                  <svg className="w-6 h-6 text-white/80 mt-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Back: Shows TRANSLATION */}
                <div
                  className="absolute w-full h-full flex items-center justify-center bg-white dark:bg-gray-700 rounded-lingoblitz p-6 text-center shadow-lg border-2 border-gray-200 dark:border-gray-600"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">{currentItem.translation}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={handleUnknownWord}
                className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-red-500 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all"
              >
                Keep practicing
              </button>
              <button
                onClick={handleKnownWord}
                className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-green-500 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all"
              >
                {isLastWordInRound ? 'Finish Practice' : 'I know it!'}
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{totalPracticedWords - wordsToPractice.length} / {totalPracticedWords}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-lingoblitz transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VocabularyPractice;