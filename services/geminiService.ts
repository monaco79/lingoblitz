import { UserSettings, Level } from '../types';
import { LEVEL_DESCRIPTIONS, LEVEL_WORD_COUNTS } from '../constants';

const API_ENDPOINT = '/api/gemini';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(apiCall: () => Promise<Response>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await apiCall();

      if (response.ok) {
        // Attempt to parse JSON, as it might be an empty response
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);
      }
      
      // Retry on specific server errors or rate limiting
      if (response.status === 429 || response.status >= 500) {
        if (attempt >= maxRetries) {
          console.error(`API call failed after ${maxRetries} attempts with status ${response.status}.`);
          throw new Error(`API call failed with status ${response.status}`);
        }
        console.warn(`API call failed with status ${response.status}. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        // For other client errors (4xx), fail immediately
        const errorBody = await response.text();
        console.error(`API call failed with status ${response.status}:`, errorBody);
        throw new Error(`API call failed with status ${response.status}`);
      }
    } catch (error) {
      // This catches network errors (e.g., fetch failing)
      if (attempt >= maxRetries) {
        console.error(`API call failed after ${maxRetries} attempts with network error.`, error);
        throw error;
      }
      console.warn(`API call failed with network error. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`, error);
      await sleep(delay);
      delay *= 2;
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
     if (error instanceof Error && error.message.includes('429')) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    console.error("Error generating topic proposals:", error);
    // Return an empty array on failure so the UI can handle it
    return [];
  }
};

export const generateArticleStream = async (topic: string, settings: UserSettings): Promise<ReadableStream<Uint8Array>> => {
    const payload = {
        topic,
        settings,
        levelDescription: LEVEL_DESCRIPTIONS[settings.level as Level],
        wordCount: LEVEL_WORD_COUNTS[settings.level as Level],
    };

    let attempt = 0;
    let delay = 1000;
    const maxRetries = 3;

    while (attempt < maxRetries) {
        attempt++;
        try {
            const response = await postToApi('generateArticleStream', payload);

            if (response.ok && response.body) {
                return response.body;
            }

            if (response.status === 429 || response.status >= 500) {
                if (attempt >= maxRetries) {
                    throw new Error(`Stream generation failed after ${maxRetries} attempts with status ${response.status}.`);
                }
                console.warn(`Stream generation failed with status ${response.status}. Retrying in ${delay / 1000}s...`);
                await sleep(delay);
                delay *= 2;
            } else {
                const errorText = await response.text();
                console.error("Error fetching article stream:", response.status, errorText);
                throw new Error("Failed to generate article.");
            }
        } catch (error) {
            if (attempt >= maxRetries) {
                console.error(`Stream generation failed after ${maxRetries} attempts with network error.`, error);
                throw new Error("Failed to generate article due to network issues.");
            }
            console.warn(`Stream generation failed with network error. Retrying in ${delay / 1000}s...`);
            await sleep(delay);
            delay *= 2;
        }
    }
    throw new Error("Failed to generate article after multiple retries.");
};


export const translateWord = async (word: string, from: string, to: string): Promise<string> => {
  try {
    const payload = { word, from, to };
    const result = await withRetry<{ translation: string }>(() => postToApi('translateWord', payload));
    return result.translation;
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      throw new Error('RATE_LIMIT_EXCEEDED');
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
    if (error instanceof Error && error.message.includes('429')) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    console.error("Error generating quiz question:", error);
    // Throw an error to be handled by the UI
    throw new Error("Failed to generate quiz question.");
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
    if (error instanceof Error && error.message.includes('429')) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    console.error("Error evaluating quiz answer:", error);
    return `There was an error evaluating your answer. Please try again.`;
  }
};
