// Last updated: 2025-11-15 18:10
// Design update: White buttons with colored borders per design rules

import React from 'react';
import LoadingSpinner from './icons/LoadingSpinner';

interface PostArticleActionsProps {
  onTakeQuiz: () => void;
  onNewBlitz: () => void;
  onPracticeVocabulary: () => void;
  canPracticeVocabulary: boolean;
  canTakeQuiz: boolean;
  isQuizReady: boolean;
  areProposalsReady: boolean;
  hasCompletedQuiz: boolean;
  hasCompletedVocabulary: boolean;
}

const PostArticleActions: React.FC<PostArticleActionsProps> = ({
  onTakeQuiz,
  onNewBlitz,
  onPracticeVocabulary,
  canPracticeVocabulary,
  canTakeQuiz,
  isQuizReady,
  areProposalsReady,
  hasCompletedQuiz,
  hasCompletedVocabulary,
}) => {
  // Determine which buttons to show based on what has been completed
  const showQuizButton = canTakeQuiz && isQuizReady;
  const showVocabularyButton = canPracticeVocabulary;
  const showNewBlitzButton = hasCompletedQuiz || hasCompletedVocabulary;

  return (
    <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-4">
      {showQuizButton && (
        <button
          onClick={onTakeQuiz}
          className={`flex-1 font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg ${hasCompletedVocabulary
              ? "gradient-lingoblitz hover:opacity-90 text-white"
              : "bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white"
            }`}
        >
          Take a quiz
        </button>
      )}

      {showVocabularyButton && (
        <button
          onClick={onPracticeVocabulary}
          className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg"
        >
          Practice vocabulary
        </button>
      )}

      {showNewBlitzButton && (
        <button
          onClick={onNewBlitz}
          disabled={!areProposalsReady}
          className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg flex justify-center items-center gap-2"
        >
          {areProposalsReady ? "New Blitz" : <><LoadingSpinner className="h-5 w-5" /> Finding ideas...</>}
        </button>
      )}

      {/* Show loading state when quiz is being prepared and nothing has been completed yet */}
      {!showQuizButton && !hasCompletedQuiz && !hasCompletedVocabulary && (
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 px-6 rounded-lingoblitz text-lg flex justify-center items-center gap-2">
          <LoadingSpinner className="h-5 w-5" /> Preparing quiz...
        </div>
      )}
    </div>
  );
};

export default PostArticleActions;