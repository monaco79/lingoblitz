// Last updated: 2025-11-20 17:30
// Fixed TTS pause/resume logic to match Article.tsx
// Fixed word click audio issue
// Inlined AudioControls to fix resume UI glitch

import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './icons/LoadingSpinner';
import { TTSSettings, Language } from '../types';
import * as ttsService from '../services/ttsService';

interface QuizProps {
  question: string;
  onAnswerSubmit: (answer: string) => void;
  isEvaluating: boolean;
  feedback: string | null;
  onContinue: () => void;
  onWordClick?: (word: string, event: React.MouseEvent<HTMLSpanElement>) => void;
  ttsSettings: TTSSettings;
  language: Language;
  hasVocabulary: boolean;
  onPracticeVocabulary: () => void;
  hasCompletedVocabulary: boolean;
}

const Quiz: React.FC<QuizProps> = ({
  question,
  onAnswerSubmit,
  isEvaluating,
  feedback,
  onContinue,
  onWordClick,
  ttsSettings,
  language,
  hasVocabulary,
  onPracticeVocabulary,
  hasCompletedVocabulary
}) => {
  const [answer, setAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const questionAutoPlayedRef = useRef(false);
  const feedbackAutoPlayedRef = useRef(false);
  const isMounted = useRef(true);

  // Track playback position
  const playbackIndexRef = useRef(0);
  const playbackOffsetRef = useRef(0);

  // Reset state when content switches
  useEffect(() => {
    playbackIndexRef.current = 0;
    playbackOffsetRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
    ttsService.stopSpeech();
  }, [question, feedback]);

  // Reset triggered refs when content changes
  useEffect(() => {
    questionAutoPlayedRef.current = false;
  }, [question]);

  useEffect(() => {
    feedbackAutoPlayedRef.current = false;
  }, [feedback]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      console.log('🧹 [Quiz] Unmounting - stopping speech');
      isMounted.current = false;
      ttsService.stopSpeech();
      setIsPlaying(false);
      setIsPaused(false);
    };
  }, []);

  // Handle TTS playback
  const handlePlay = () => {
    if (!ttsSettings) return;

    // If already playing and NOT paused, do nothing
    if (isPlaying && !isPaused) return;

    console.log(`▶️ [Quiz] Play/Resume clicked. Resume index: ${playbackIndexRef.current}`);
    setIsPlaying(true);
    setIsPaused(false);

    const rawText = feedback || question;

    // CLEANING: Strip markdown characters for audio
    // IMPORTANT: This cleaning must be consistent for index tracking
    const textToClean = rawText
      .replace(/[*#_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Logic to resume from index
    const startIndex = playbackIndexRef.current;
    const textToSpeak = (startIndex > 0 && startIndex < textToClean.length - 5)
      ? textToClean.substring(startIndex)
      : textToClean;

    if (startIndex === 0) {
      playbackOffsetRef.current = 0;
    } else {
      playbackOffsetRef.current = startIndex;
    }

    ttsService.speak(
      textToSpeak,
      ttsSettings.voice,
      ttsSettings.speed,
      language,
      () => {
        console.log('🎵 [Quiz] Playback ended');
        if (isMounted.current) {
          if (isPaused) {
            console.log('⏸️ [Quiz] Paused - not resetting index');
            return;
          }

          // Double check if we are still speaking according to browser
          if (ttsService.isSpeaking()) {
            console.warn('⚠️ [Quiz] onEnd fired but still speaking - ignoring');
            return;
          }
          setIsPlaying(false);
          setIsPaused(false);
          playbackIndexRef.current = 0;
          playbackOffsetRef.current = 0;
        }
      },
      (charIndex) => {
        // Update global index: Offset + current chunk position
        playbackIndexRef.current = playbackOffsetRef.current + charIndex;
      }
    ).catch(error => {
      console.error('❌ [Quiz] TTS Error:', error);
      if (isMounted.current) {
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

  // Auto-play logic for QUESTION
  useEffect(() => {
    if (!feedback && ttsSettings?.autoRead && !questionAutoPlayedRef.current) {
      questionAutoPlayedRef.current = true;
      const timer = setTimeout(() => {
        if (isMounted.current && !isPlaying) {
          handlePlay();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [question, feedback, ttsSettings]); // Removed handlePlay dependency

  // Auto-play logic for FEEDBACK
  useEffect(() => {
    if (feedback && ttsSettings?.autoRead && !feedbackAutoPlayedRef.current) {
      feedbackAutoPlayedRef.current = true;

      // Force reset before playing feedback
      playbackIndexRef.current = 0;
      playbackOffsetRef.current = 0;
      setIsPlaying(false);
      setIsPaused(false);
      ttsService.stopSpeech();

      const timer = setTimeout(() => {
        if (isMounted.current) {
          handlePlay();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [feedback, ttsSettings]); // Removed handlePlay dependency

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      // Stop speech on submit
      ttsService.stopSpeech();
      setIsPlaying(false);
      setIsPaused(false);
      onAnswerSubmit(answer.trim());
    }
  };

  const cleanWordForLookup = (word: string): string => {
    return word.trim().replace(/^['".,!?;:]+|['".,!?;:]+$/g, '').toLowerCase();
  };

  const makeWordsClickable = (text: string) => {
    if (!onWordClick) {
      return text.replace(/[*#_]/g, '');
    }

    const words = text.split(/(\s+|[.,!?;:"()])/).filter(Boolean);

    return words.map((word, index) => {
      const isBold = word.includes('**');
      const isItalic = !isBold && word.includes('*');
      const displayWord = word.replace(/[*#_]/g, '');

      const lookupWord = cleanWordForLookup(displayWord);
      const isClickable = /\w/.test(lookupWord);

      return (
        <span
          key={index}
          className={`
            ${isClickable ? "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200 px-1 py-0.5 -mx-1 -my-0.5" : ""}
            ${isBold ? "font-bold" : ""}
            ${isItalic ? "italic" : ""}
          `}
          onClick={(e) => {
            if (isClickable && onWordClick) {
              // Stop playback logic identical to Article.tsx
              // If we are playing, stop the audio but keep "Playing=false, Paused=true"
              // so user can hit "Resume" (which triggers handlePlay to restart from index)
              if (isPlaying) {
                ttsService.stopSpeech();
                setIsPlaying(false);
                setIsPaused(true);
              }
              // NOTE: We do NOT call ttsService.stopSpeech() here unconditionally anymore.
              // App.tsx handles the actual word playback which involves stopping previous speech.
              // Calling it here again might race with App.tsx's playWordAudio.

              onWordClick(lookupWord, e);
            }
          }}
        >
          {displayWord}
        </span>
      );
    });
  };

  // Logic identical to Article.tsx
  const handlePauseResume = () => {
    if (isPaused) {
      // Resume: Since we "stopped" to pause, we just restart playback.
      // handlePlay() will pick up from playbackIndexRef.current.
      handlePlay();
    } else {
      // Pause: We simulate pause by stopping speech but keeping the "Paused" UI state.
      // This avoids unreliable native browser pause/resume behavior.
      ttsService.stopSpeech();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    console.log('⏹️ [Quiz] Stop button clicked');
    ttsService.stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    playbackIndexRef.current = 0;
    playbackOffsetRef.current = 0;
  };

  // Render helper for audio controls
  const renderAudioControls = () => (
    <div className="flex items-center gap-2">
      {isPlaying || isPaused ? (
        <>
          <button
            type="button"
            onClick={handlePauseResume}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              // Resume Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              // Pause Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
            title="Stop"
          >
            {/* Corrected Stop Icon as requested */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
          title="Play"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      )}
    </div>
  );

  // Determine button styles based on state
  const showPracticeButton = hasVocabulary && !hasCompletedVocabulary;
  const practiceButtonClass = "gradient-lingoblitz hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg flex-1";

  // Next Blitz is secondary (white) if Practice is shown, otherwise primary (gradient)
  const nextBlitzButtonClass = showPracticeButton
    ? "bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-[#6263C4] text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg flex-1"
    : "gradient-lingoblitz hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg flex-1";

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lingoblitz shadow-lg flex flex-col gap-6">
      {!feedback ? (
        // QUESTION VIEW
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Quiz time!</h2>
              {renderAudioControls()}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-aleo">
              {makeWordsClickable(question)}
            </p>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-32 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lingoblitz py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white placeholder-gray-400 font-aleo text-lg resize-none"
            disabled={isEvaluating}
          />

          <button
            type="submit"
            disabled={isEvaluating || !answer.trim()}
            className="gradient-lingoblitz hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lingoblitz transition-all duration-200 text-lg flex justify-center items-center gap-2 shadow-md"
          >
            {isEvaluating ? (
              <>
                <LoadingSpinner className="h-5 w-5" />
                Evaluating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Submit your answer
              </>
            )}
          </button>
        </form>
      ) : (
        // FEEDBACK VIEW
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h2>
            {renderAudioControls()}
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lingoblitz border border-gray-200 dark:border-gray-600">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-aleo text-lg leading-relaxed">
              {makeWordsClickable(feedback)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showPracticeButton && (
              <button
                onClick={onPracticeVocabulary}
                className={practiceButtonClass}
              >
                Practice Vocabulary
              </button>
            )}
            <button
              onClick={onContinue}
              className={nextBlitzButtonClass}
            >
              Next Blitz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
