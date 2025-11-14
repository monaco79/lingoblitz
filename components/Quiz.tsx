import React, { useState } from 'react';
import LoadingSpinner from './icons/LoadingSpinner';
import RefreshIcon from './icons/RefreshIcon';

interface QuizProps {
  question: string;
  onAnswerSubmit: (answer: string) => void;
  isEvaluating: boolean;
  feedback: string | null;
  onContinue: () => void;
  isError: boolean;
  onRetry: () => void;
  lastAnswer: string;
}

const Quiz: React.FC<QuizProps> = ({ question, onAnswerSubmit, isEvaluating, feedback, onContinue, isError, onRetry, lastAnswer }) => {
  const [answer, setAnswer] = useState(lastAnswer || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit(answer.trim());
    }
  };

  if (isError) {
    return (
      <div className="w-full max-w-4xl p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col gap-4 items-center text-center">
        <h3 className="text-xl font-bold text-red-500">Evaluation Failed</h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't evaluate your answer. This might be a temporary issue.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          <button
            onClick={onRetry}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshIcon />
            Try Again
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Continue to next Blitz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col gap-6">
      {!feedback ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400">Quiz Time!</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">{question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-28 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white"
            disabled={isEvaluating}
          />
          <button
            type="submit"
            disabled={isEvaluating || !answer.trim()}
            className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg flex justify-center items-center gap-2"
          >
            {isEvaluating ? <><LoadingSpinner className="h-5 w-5" /> Evaluating...</> : "Submit your answer"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">Feedback</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{feedback}</p>
          </div>
          <button
            onClick={onContinue}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg"
          >
            Continue to next Blitz
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
