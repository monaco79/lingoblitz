import React, { useState, useEffect, useCallback } from 'react';
import { UserSettings, AppState, TranslationPopup } from './types';
import Onboarding from './components/Onboarding';
import SettingsModal from './components/SettingsModal';
import Article from './components/Article';
import TopicSelector from './components/TopicSelector';
import LoadingSpinner from './components/icons/LoadingSpinner';
import SettingsIcon from './components/icons/SettingsIcon';
import CloseIcon from './components/icons/CloseIcon';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';
import PostArticleActions from './components/PostArticleActions';
import Quiz from './components/Quiz';
import * as geminiService from './services/geminiService';

const App: React.FC = () => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [topicProposals, setTopicProposals] = useState<string[]>([]);
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [articleContent, setArticleContent] = useState<string>('');
  const [translationPopup, setTranslationPopup] = useState<TranslationPopup | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [skippedProposalHistory, setSkippedProposalHistory] = useState<string | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [isQuizReady, setIsQuizReady] = useState(false);
  const [areProposalsReady, setAreProposalsReady] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('lingoBlitzTheme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lingoBlitzTheme', theme);
  }, [theme]);
  
  const showError = (message: string) => {
    setErrorNotification(message);
    setTimeout(() => setErrorNotification(null), 5000);
  }

  useEffect(() => {
    const savedSettings = localStorage.getItem('lingoBlitzSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setUserSettings({ blitzedTopics: [], ...settings });
      setAppState(AppState.GENERATING_PROPOSALS);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleOnboardingComplete = (settings: UserSettings) => {
    const completeSettings = { ...settings, blitzedTopics: [] };
    localStorage.setItem('lingoBlitzSettings', JSON.stringify(completeSettings));
    setUserSettings(completeSettings);
    setAppState(AppState.GENERATING_PROPOSALS);
  };
  
  const handleSaveSettings = (settings: UserSettings) => {
    const completeSettings = { ...settings, blitzedTopics: userSettings?.blitzedTopics || [] };
    localStorage.setItem('lingoBlitzSettings', JSON.stringify(completeSettings));
    setUserSettings(completeSettings);
    setIsSettingsOpen(false);
    setArticleContent('');
    setArticleTitle('');
    setAppState(AppState.GENERATING_PROPOSALS);
  };

  const fetchProposals = useCallback(async (
      { interests, blitzedTopics, learningLanguage, level }: UserSettings,
      count: number,
      topicsToAvoid: string[] = []
    ) => {
      try {
        return await geminiService.generateTopicProposals(interests, [...blitzedTopics, ...topicsToAvoid], count, learningLanguage, level);
      } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
          showError("You've hit the request limit. Please wait a minute and try again.");
          return [];
        }
        throw error;
      }
  }, []);

  const fetchInitialProposals = useCallback(async () => {
    if (userSettings) {
      setTopicProposals([]);
      setSkippedProposalHistory(null);
      const proposals = await fetchProposals(userSettings, 2);
      setTopicProposals(proposals);
      setAppState(AppState.READY);
    }
  }, [userSettings, fetchProposals]);

  useEffect(() => {
    if (appState === AppState.GENERATING_PROPOSALS) {
      fetchInitialProposals();
    }
  }, [appState, fetchInitialProposals]);

  const handleBlitz = async (topic: string) => {
    if (!userSettings) return;

    setAppState(AppState.GENERATING_ARTICLE);
    setTranslationPopup(null);
    setArticleTitle('');
    setArticleContent('');
    setQuizQuestion(null);
    setQuizFeedback(null);
    setIsQuizReady(false);
    setAreProposalsReady(false);
    const currentProposals = [...topicProposals];
    setTopicProposals([]);

    try {
      const stream = await geminiService.generateArticleStream(topic, userSettings);
      if (!stream) throw new Error("Failed to get article stream.");

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let titleFound = false;
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;

        if (!titleFound && accumulatedText.includes('\n')) {
          const parts = accumulatedText.split('\n');
          setArticleTitle(parts[0].trim());
          finalContent = parts.slice(1).join('\n');
          setArticleContent(finalContent);
          titleFound = true;
        } else if (titleFound) {
          finalContent += chunkText;
          setArticleContent(prev => prev + chunkText);
        }
      }

      if (!titleFound && accumulatedText.length > 0) {
        const parts = accumulatedText.split('\n');
        setArticleTitle(parts[0].trim());
        finalContent = parts.slice(1).join('\n');
        setArticleContent(finalContent);
      }
      
      const updatedBlitzedTopics = [...userSettings.blitzedTopics, topic];
      const updatedSettings = { ...userSettings, blitzedTopics: updatedBlitzedTopics };
      setUserSettings(updatedSettings);
      localStorage.setItem('lingoBlitzSettings', JSON.stringify(updatedSettings));
      
      setAppState(AppState.POST_ARTICLE_CHOICE);
      
      // Chain background tasks to avoid hitting rate limits
      try {
        const question = await geminiService.generateQuizQuestion(finalContent, userSettings.learningLanguage, userSettings.level);
        setQuizQuestion(question);
        setIsQuizReady(true);
        
        // Now fetch proposals
        const skipped = currentProposals.find(p => p !== topic) || null;
        const topicsToAvoid = [...updatedSettings.blitzedTopics];
        let proposalsToKeep: string[] = [];
        if (skipped && skipped !== skippedProposalHistory) {
            proposalsToKeep.push(skipped);
            topicsToAvoid.push(skipped);
        }
        const numToGenerate = 2 - proposalsToKeep.length;
        const newProposals = numToGenerate > 0 ? await fetchProposals(updatedSettings, numToGenerate, topicsToAvoid) : [];
        
        setTopicProposals([...proposalsToKeep, ...newProposals].sort(() => Math.random() - 0.5));
        setSkippedProposalHistory(skipped);
        setAreProposalsReady(true);

      } catch (error) {
        // Errors from background tasks are handled inside the service
        // but we can set states to ready to unblock UI
        setIsQuizReady(true); // Let user proceed even if quiz fails
        setAreProposalsReady(true); // Let user proceed even if proposals fail
      }

    } catch (error) {
      console.error("Error during Blitz generation:", error);
      setArticleTitle("Error");
      setArticleContent("There was an error generating the article. Please try again.");
      setAppState(AppState.POST_ARTICLE_CHOICE);
      setIsQuizReady(true);
      setAreProposalsReady(true);
    }
  };

  const handleWordClick = async (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
    if (!userSettings) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const popupTop = window.scrollY + rect.top - 85; 
    const popupLeft = window.scrollX + rect.left + rect.width / 2;

    setTranslationPopup({ word, translation: '...', position: { top: popupTop, left: popupLeft } });

    try {
        const translation = await geminiService.translateWord(word, userSettings.learningLanguage, userSettings.nativeLanguage);
        setTranslationPopup(current => 
          (current && current.word === word)
            ? { ...current, translation }
            : current
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
            showError("Translation limit hit. Please wait a moment.");
        }
        setTranslationPopup(null);
    }
  };
  
  const handleTakeQuiz = () => setAppState(AppState.SHOWING_QUIZ);
  
  const handleNewBlitz = () => {
    setArticleTitle('');
    setArticleContent('');
    setAppState(AppState.READY);
  };
  
  const handleAnswerSubmit = async (answer: string) => {
    if (!userSettings || !quizQuestion || !articleContent) return;
    
    setAppState(AppState.EVALUATING_QUIZ);
    try {
      const feedback = await geminiService.evaluateQuizAnswer(
        articleContent, quizQuestion, answer, userSettings.learningLanguage, userSettings.level
      );
      setQuizFeedback(feedback);
    } catch(error) {
        if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
            showError("Evaluation limit hit. Please try again.");
        }
        setQuizFeedback("Sorry, there was an error evaluating your answer.");
    } finally {
      setAppState(AppState.SHOWING_QUIZ_FEEDBACK);
    }
  };
  
  const handleContinueToNextBlitz = () => {
    setArticleTitle('');
    setArticleContent('');
    setQuizQuestion(null);
    setQuizFeedback(null);
    setAppState(AppState.READY);
  };

  const renderContent = () => {
    if (!userSettings) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }
    
    return (
        <div className="w-full min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <header className="w-full max-w-4xl flex justify-between items-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">LingoBlitz</h1>
                <div className="flex items-center gap-4">
                  <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                  </button>
                  <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <SettingsIcon className="h-7 w-7" />
                  </button>
                </div>
            </header>

            {appState === AppState.GENERATING_ARTICLE && !articleContent && !articleTitle && (
                 <div className="w-full max-w-4xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[200px] gap-4">
                    <LoadingSpinner className="h-8 w-8 text-sky-500" />
                    <p className="text-lg text-gray-600 dark:text-gray-400">Generating your Blitz...</p>
                </div>
            )}

            {(articleTitle || articleContent) && (
                <Article title={articleTitle} content={articleContent} onWordClick={handleWordClick} />
            )}

            {appState === AppState.POST_ARTICLE_CHOICE && (
                <PostArticleActions 
                  onTakeQuiz={handleTakeQuiz}
                  onNewBlitz={handleNewBlitz}
                  isQuizReady={isQuizReady}
                  areProposalsReady={areProposalsReady}
                />
            )}

            {(appState === AppState.SHOWING_QUIZ || appState === AppState.EVALUATING_QUIZ || appState === AppState.SHOWING_QUIZ_FEEDBACK) && quizQuestion && (
                <Quiz 
                    question={quizQuestion}
                    onAnswerSubmit={handleAnswerSubmit}
                    isEvaluating={appState === AppState.EVALUATING_QUIZ}
                    feedback={quizFeedback}
                    onContinue={handleContinueToNextBlitz}
                />
            )}
            
            {appState === AppState.GENERATING_PROPOSALS && (
              <div className="w-full max-w-4xl p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[200px] gap-4">
                <LoadingSpinner className="h-8 w-8 text-sky-500" />
                <p className="text-lg text-gray-600 dark:text-gray-400">Generating new topic ideas...</p>
              </div>
            )}
            
            {topicProposals.length > 0 && appState === AppState.READY && (
                <TopicSelector 
                  proposals={topicProposals} 
                  onBlitz={handleBlitz} 
                  onNewProposals={() => {
                      setTopicProposals([]);
                      setAppState(AppState.GENERATING_PROPOSALS);
                  }} 
                  isBlitzing={false}
                />
            )}
        </div>
    );
  };

  return (
    <main>
      {renderContent()}
      {isSettingsOpen && userSettings && (
        <SettingsModal currentSettings={userSettings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />
      )}
      {translationPopup && (
        <div
          className="fixed z-50 transform -translate-x-1/2 pointer-events-none"
          style={{
            top: `${translationPopup.position.top}px`,
            left: `${translationPopup.position.left}px`,
          }}
        >
          <div
            className="relative bg-white dark:bg-gray-800 border border-sky-500 rounded-lg shadow-xl p-3 text-center cursor-pointer pointer-events-auto"
            style={{ minWidth: '120px' }}
            onClick={(e) => {
                e.stopPropagation();
                setTranslationPopup(null);
            }}
          >
            <button
              onClick={(e) => {
                  e.stopPropagation();
                  setTranslationPopup(null);
              }}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-full p-0.5 border border-gray-300 dark:border-gray-600"
            >
              <CloseIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <p className="font-bold text-sky-500 dark:text-sky-400">{translationPopup.word}</p>
            <p className="text-lg text-gray-800 dark:text-gray-100">{translationPopup.translation}</p>
            
            <div
              className="absolute left-1/2 w-0 h-0 -translate-x-1/2 border-x-[10px] border-x-transparent border-t-[10px] border-t-sky-500"
              style={{ bottom: '-10px' }}
            ></div>
            
            <div
              className="absolute left-1/2 w-0 h-0 -translate-x-1/2 border-x-[8px] border-x-transparent border-t-[8px] border-t-white dark:border-t-gray-800"
              style={{ bottom: '-9px' }}
            ></div>
          </div>
        </div>
      )}
      {errorNotification && (
         <div className="fixed bottom-5 right-5 bg-red-500 text-white py-3 px-5 rounded-lg shadow-xl animate-bounce">
            {errorNotification}
        </div>
      )}
    </main>
  );
};

export default App;