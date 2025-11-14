import React from 'react';
import LoadingSpinner from './icons/LoadingSpinner';

interface PostArticleActionsProps {
  onTakeQuiz: () => void;
  onNewBlitz: () => void;
  isQuizReady: boolean;
  areProposalsReady: boolean;
}

const PostArticleActions: React.FC<PostArticleActionsProps> = ({
  onTakeQuiz,
  onNewBlitz,
  isQuizReady,
  areProposalsReady,
}) => {
  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col sm:flex-row gap-4">
      <button
        onClick={onTakeQuiz}
        disabled={!isQuizReady}
        className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg flex justify-center items-center gap-2"
      >
        {isQuizReady ? "Take a quiz" : <><LoadingSpinner className="h-5 w-5" /> Preparing quiz...</>}
      </button>
      <button
        onClick={onNewBlitz}
        disabled={!areProposalsReady}
        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {areProposalsReady ? "New Blitz" : <><LoadingSpinner className="h-5 w-5" /> Finding ideas...</>}
      </button>
    </div>
  );
};

export default PostArticleActions;
