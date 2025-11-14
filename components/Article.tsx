import React from 'react';

interface ArticleProps {
  title: string;
  content: string;
  onWordClick: (word: string, event: React.MouseEvent<HTMLSpanElement>) => void;
}

const Article: React.FC<ArticleProps> = ({ title, content, onWordClick }) => {
  // Splits by whitespace or punctuation, keeping the delimiters.
  const words = content.split(/(\s+|[.,!?;:"()])/).filter(Boolean);

  const cleanWord = (word: string): string => {
    // A more robust cleaning function
    return word.trim().replace(/^['".,!?;:]+|['".,!?;:]+$/g, '').toLowerCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-4xl w-full">
      <h2 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-6 text-center">{title}</h2>
      <p className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-300">
        {words.map((word, index) => {
          const cleaned = cleanWord(word);
          // Only make spans clickable if they contain alphanumeric characters
          const isClickable = /\w/.test(cleaned);

          return (
            <span
              key={index}
              className={isClickable ? "cursor-pointer hover:bg-sky-200 dark:hover:bg-sky-700 rounded-md transition-colors duration-200 px-1 py-0.5 -mx-1 -my-0.5" : ""}
              onClick={(e) => {
                if (isClickable) {
                  onWordClick(cleaned, e);
                }
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
};

export default Article;
