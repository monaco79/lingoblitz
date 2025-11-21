// Last updated: 2025-11-18 19:35
// Implemented resume-from-stop logic using tracked charIndex

import React, { useState, useEffect, useRef } from 'react';
import { Level, TTSSettings, Language } from '../types';
import * as ttsService from '../services/ttsService';

interface ArticleProps {
  title: string;
  content: string;
  level: Level;
  ttsSettings: TTSSettings;
  language: Language;
  onWordClick: (word: string, event: React.MouseEvent<HTMLSpanElement>) => void;
}

const Article: React.FC<ArticleProps> = ({ title, content, level, ttsSettings, language, onWordClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTriggered = useRef(false);
  const isMounted = useRef(true);

  // Tracks the global character index where playback is currently at
  const playbackIndexRef = useRef(0);
  // Tracks the starting offset of the current utterance (used when resuming)
  const playbackOffsetRef = useRef(0);

  const cleanWord = (word: string): string => {
    return word.trim().replace(/^['".,!?;:]+|['".,!?;:]+$/g, '').toLowerCase();
  };

  // Reset trackers when content changes
  useEffect(() => {
    playbackIndexRef.current = 0;
    playbackOffsetRef.current = 0;
  }, [title, content]);

  // Auto-play when article loads
  useEffect(() => {
    autoPlayTriggered.current = false;

    if (ttsSettings.autoRead &&
      content &&
      title &&
      ttsSettings.voice &&
      !autoPlayTriggered.current) {

      autoPlayTriggered.current = true;
      console.log('🎵 Auto-play enabled - will start in 800ms');

      const timer = setTimeout(() => {
        if (isMounted.current) {
          handlePlay();
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [content, title]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      console.log('🧹 Article unmounting - stopping speech');
      isMounted.current = false;
      ttsService.stopSpeech();
      setIsPlaying(false);
      setIsPaused(false);
    };
  }, []);

  const makeWordsClickable = (text: string) => {
    const words = text.split(/(\s+|[.,!?;:"()])/).filter(Boolean);

    return words.map((word, arrayIndex) => {
      const cleaned = cleanWord(word);
      const isClickable = /\w/.test(cleaned);

      return (
        <span
          key={`word - ${ arrayIndex } `}
          className={`
            ${ isClickable ? "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-100 px-1 py-0.5 -mx-1 -my-0.5" : "" }
`}
          onClick={(e) => {
            if (isClickable) {
              // Stop playback if active so user can hear the word
              if (isPlaying) {
                ttsService.stopSpeech();
                setIsPlaying(false);
                setIsPaused(true); // Mark as "paused" UI-wise, though technically stopped
              }
              onWordClick(cleaned, e);
            }
          }}
        >
          {word}
        </span>
      );
    });
  };

  const handlePlay = () => {
    if (isPlaying && !isPaused) {
      return;
    }

    console.log(`▶️ Play / Resume clicked.Resume index: ${ playbackIndexRef.current } `);
    setIsPlaying(true);
    setIsPaused(false);

    const fullText = `${ title }. ${ content } `;

    // Determine where to start: from 0 or from the last stopped position
    const startIndex = playbackIndexRef.current;

    // If we are near the end, just restart. Otherwise slice.
    const textToSpeak = (startIndex > 0 && startIndex < fullText.length - 5)
      ? fullText.substring(startIndex)
      : fullText;

    // If we restart from 0, reset offset. If we resume, offset is the start index.
    playbackOffsetRef.current = (startIndex > 0 && startIndex < fullText.length - 5) ? startIndex : 0;

    if (playbackOffsetRef.current === 0) {
      playbackIndexRef.current = 0;
    }

    ttsService.speak(
      textToSpeak,
      ttsSettings.voice,
      ttsSettings.speed,
      language,
      () => {
        console.log('🎵 Playback ended normally');
        if (isMounted.current) {
          // Robustness check: If browser says it's still speaking, don't reset state.
          // This fixes the issue where onEnd fires prematurely on some browsers/resumes.
          if (window.speechSynthesis.speaking) {
            console.warn('⚠️ [Article] onEnd fired but still speaking - ignoring');
            return;
          }
          setIsPlaying(false);
          setIsPaused(false);
          // Reset index on completion
          playbackIndexRef.current = 0;
          playbackOffsetRef.current = 0;
        }
      },
      (charIndex) => {
        // Update the global index: Offset (start of this chunk) + current chunk progress
        playbackIndexRef.current = playbackOffsetRef.current + charIndex;
      }
    ).catch(error => {
      console.error('❌ TTS Error:', error);
      if (isMounted.current) {
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

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
    console.log('⏹️ Stop button clicked');
    ttsService.stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    playbackIndexRef.current = 0;
    playbackOffsetRef.current = 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lingoblitz shadow-lg max-w-4xl w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{level}</span>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying || isPaused ? (
            <>
              <button
                onClick={handlePauseResume}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleStop}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                title="Stop"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </>
          ) : (
            <button
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
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {makeWordsClickable(title)}
      </h2>

      <div className="font-aleo text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-300 space-y-4">
        {content.split('\n').map((paragraph, pIndex) => {
          if (!paragraph.trim()) return null;
          return (
            <p key={`p - ${ pIndex } `}>
              {makeWordsClickable(paragraph)}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default Article;
