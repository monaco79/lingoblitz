import { UserSettings, Level } from '../types';
import { LEVEL_DESCRIPTIONS, LEVEL_WORD_COUNTS } from '../constants';

const API_ENDPOINT = '/api/gemini';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(apiCall: () => Promise<Response>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    const response = await apiCall();
    if (response.ok) {
      return response.json() as Promise<T>;
    }
    
    if (response.status === 429) { // Rate limit error
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`API call failed after ${maxRetries} attempts with status 429.`);
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
      delay *= 2;
    } else {
      // For other errors, fail immediately
      const errorBody = await response.text();
      console.error(`API call failed with status ${response.status}:`, errorBody);
      throw new Error(`API call failed with status ${response.status}`);
    }
  }
  throw new Error("Exited retry loop unexpectedly.");
};

const postToApi = (action: string, payload: object) => {
  return fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
};

export const generateTopicProposals = async (interests: string[], topicsToAvoid: string[], count: number, learningLanguage: string, level: Level): Promise<string[]> => {
  try {
    const payload = { 
      interests, 
      topicsToAvoid, 
      count, 
      learningLanguage, 
      level, 
      levelDescription: LEVEL_DESCRIPTIONS[level] 
    };
    const result = await withRetry<{ topics: string[] }>(() => postToApi('generateTopicProposals', payload));
    return result.topics || [];
  } catch (error) {
     if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error; // Re-throw for specific UI handling
    }
    console.error("Error generating topic proposals:", error);
    const fallbacks = ["The History of Coffee", "Exploring the Amazon Rainforest", "The Science of Sleep", "How Cameras Work"];
    return fallbacks.slice(0, count);
  }
};

export const generateArticleStream = async (topic: string, settings: UserSettings): Promise<ReadableStream<Uint8Array> | null> => {
  const payload = {
    topic,
    settings,
    levelDescription: LEVEL_DESCRIPTIONS[settings.level as Level],
    wordCount: LEVEL_WORD_COUNTS[settings.level as Level],
  };
  const response = await postToApi('generateArticleStream', payload);

  if (!response.ok) {
    console.error("Error fetching article stream:", response.statusText);
    throw new Error("Failed to generate article.");
  }
  return response.body;
};

export const translateWord = async (word: string, from: string, to: string): Promise<string> => {
  try {
    const payload = { word, from, to };
    const result = await withRetry<{ translation: string }>(() => postToApi('translateWord', payload));
    return result.translation;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error; // Re-throw for specific UI handling
    }
    console.error("Error translating word:", error);
    return "Translation failed.";
  }
};

export const generateQuizQuestion = async (articleContent: string, learningLanguage: string, level: Level): Promise<string> => {
  try {
    const payload = { 
      articleContent, 
      learningLanguage, 
      level, 
      levelDescription: LEVEL_DESCRIPTIONS[level] 
    };
    const result = await withRetry<{ question: string }>(() => postToApi('generateQuizQuestion', payload));
    return result.question;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error; // Re-throw for specific UI handling
    }
    console.error("Error generating quiz question:", error);
    return `What was the main idea of the article? (Error generating specific question)`;
  }
};

export const evaluateQuizAnswer = async (articleContent: string, question: string, userAnswer: string, learningLanguage: string, level: Level): Promise<string> => {
  try {
    const payload = {
      articleContent,
      question,
      userAnswer,
      learningLanguage,
      level,
      levelDescription: LEVEL_DESCRIPTIONS[level],
    };
    const result = await withRetry<{ feedback: string }>(() => postToApi('evaluateQuizAnswer', payload));
    return result.feedback;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error; // Re-throw for specific UI handling
    }
    console.error("Error evaluating quiz answer:", error);
    return `There was an error evaluating your answer. Please try again.`;
  }
};
