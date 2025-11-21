import { UserSettings, Language, Level, Topic } from '../types';

// Helper for retrying fetch requests
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // If it's a 500 error, it might be transient, so throw to retry
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      // For client errors (4xx), don't retry
      return response;
    }
    return response;
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

export const generateArticleStream = async (topic: string, settings: UserSettings) => {
  try {
    const response = await fetch('/api/generate-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, settings }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Create an async generator to mimic the OpenAI stream interface
    async function* streamGenerator() {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Mimic OpenAI chunk structure
        yield {
          choices: [{
            delta: { content: chunk }
          }]
        };
      }
    }

    return streamGenerator();

  } catch (error) {
    console.error("Error calling generate-article API:", error);
    throw error;
  }
};

export const translateWord = async (word: string, from: Language, to: Language): Promise<string> => {
  try {
    const response = await fetchWithRetry('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, from, to }),
    });

    if (!response.ok) return "Translation unavailable";

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error("Error calling translate API:", error);
    return "Translation unavailable";
  }
};

export const generateTopicProposals = async (
  interests: Topic[],
  previouslyBlitzed: string[],
  count: number,
  language: Language,
  level: Level
): Promise<string[]> => {
  try {
    const response = await fetchWithRetry('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests, previouslyBlitzed, count, language, level }),
    });

    if (!response.ok) return ["Travel", "Food"]; // Fallback

    const data = await response.json();
    return data.proposals || [];
  } catch (error) {
    console.error("Error calling proposals API:", error);
    return ["Travel", "Food"]; // Fallback
  }
};

export const generateQuizQuestion = async (
  articleContent: string,
  language: Language,
  level: Level
): Promise<string> => {
  try {
    const response = await fetchWithRetry('/api/quiz-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleContent, language, level }),
    });

    if (!response.ok) return "Quiz generation failed.";

    const data = await response.json();
    return data.question;
  } catch (error) {
    console.error("Error calling quiz-generate API:", error);
    return "Quiz generation failed.";
  }
};

export const evaluateQuizAnswer = async (
  articleContent: string,
  question: string,
  userAnswer: string,
  language: Language,
  level: Level
): Promise<string> => {
  try {
    const response = await fetchWithRetry('/api/quiz-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleContent, question, userAnswer, language, level }),
    });

    if (!response.ok) return "Feedback unavailable.";

    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error("Error calling quiz-evaluate API:", error);
    return "Feedback unavailable.";
  }
};