// Last updated: 2025-11-15 15:43
// OpenAI Migration - ALL functions migrated from Gemini
// Prompt Caching: System prompts are cached automatically by OpenAI

import OpenAI from 'openai';
import { UserSettings, Level } from '../types';
import { LEVEL_DESCRIPTIONS, LEVEL_WORD_COUNTS, OPENAI_CONFIG } from '../constants';

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
});

// Development logging flag
const DEV_LOGGING = process.env.NODE_ENV === 'development';

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper for API calls with exponential backoff
 * Handles rate limiting (429) and service overload (503) errors
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      const errorString = error instanceof Error ? error.message : String(error);

      // Check for retryable errors
      const isRetryable = errorString.includes('429') ||
        errorString.includes('503') ||
        errorString.includes('overloaded') ||
        errorString.includes('UNAVAILABLE');

      if (isRetryable) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`API call failed after ${maxRetries} attempts.`, error);
          throw error;
        }

        const errorType = errorString.includes('503') || errorString.includes('overloaded')
          ? 'Service overloaded'
          : 'Rate limit hit';

        console.warn(`${errorType}. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("Exited retry loop unexpectedly.");
};

/**
 * Generate article stream with OpenAI
 * PROMPT CACHING: System prompt is generic and cached automatically
 * Variables are in user prompt to maximize cache hits
 */
export const generateArticleStream = async (topic: string, settings: UserSettings) => {
  const perfStart = performance.now();

  if (DEV_LOGGING) {
    console.log('🔵 [PERF] generateArticleStream() for:', topic);
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
      // so we don't have to change the consuming code in App.tsx too much
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
    // Check cache first (simple in-memory cache could be added here if needed, 
    // but for now we rely on the server or just fetch)

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
  }

  const parsed = JSON.parse(content);
  const topics = parsed.topics || [];

  if (DEV_LOGGING) {
    console.log(`✅ [TOPICS] Generated ${topics.length} topics:`, topics);
    if (topics.length !== count) {
      console.log(`⚠️ [TOPICS] Expected ${count} topics but got ${topics.length}, truncating to ${count}`);
    }
  }

  // Ensure we return exactly 'count' topics
  return topics.slice(0, count);
} catch (error) {
  console.error("Error generating topic proposals:", error);
  return [];
}
};

/**
 * Generate a quiz question based on article content
 * PROMPT CACHING: System prompt is cached
 */
export const generateQuizQuestion = async (
  articleContent: string,
  learningLanguage: string,
  level: Level
): Promise<string> => {
  const levelDescription = LEVEL_DESCRIPTIONS[level];

  if (DEV_LOGGING) {
    console.log(`🔵 [QUIZ] Generating question for ${level} level article`);
  }

  try {
    // System prompt - CACHED (generic instruction)
    const systemPrompt = `You are a language teacher creating comprehension questions. Generate questions that test understanding of the article content.`;

    // User prompt - contains all variables
    const userPrompt = `Based on this article, generate ONE open-ended comprehension question in ${learningLanguage}.

Article:
${articleContent}

REQUIREMENTS:
1. Question must be in ${learningLanguage}
2. Appropriate for ${level} level (${levelDescription})
3. Should test understanding of the main content
4. Should require a sentence or two to answer
5. Avoid yes/no questions

Return ONLY the question text, no additional formatting.`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt }, // CACHED
        { role: 'user', content: userPrompt }
      ],
      temperature: OPENAI_CONFIG.QUIZ_TEMPERATURE,
    }));

    const question = response.choices[0]?.message?.content?.trim() || '';

    if (DEV_LOGGING) {
      console.log(`✅ [QUIZ] Generated question: "${question}"`);
    }

    return question || `What did you learn from this article?`;
  } catch (error) {
    console.error("Error generating quiz question:", error);
    return `What did you learn from this article? (Error generating question)`;
  }
};

/**
 * Evaluate a quiz answer
 * PROMPT CACHING: System prompt is cached
 */
export const evaluateQuizAnswer = async (
  articleContent: string,
  question: string,
  userAnswer: string,
  learningLanguage: string,
  level: Level
): Promise<string> => {
  const levelDescription = LEVEL_DESCRIPTIONS[level];

  if (DEV_LOGGING) {
    console.log(`🔵 [EVAL] Evaluating answer for ${level} level`);
  }

  try {
    // System prompt - CACHED (generic instruction)
    const systemPrompt = `You are a friendly language tutor providing quiz feedback. Evaluate both content accuracy and language quality. Be encouraging and constructive.`;

    // User prompt - contains all variables
    const userPrompt = `Evaluate this ${level} level ${learningLanguage} learner's quiz answer.

Article: ${articleContent}
Question: "${question}"
Answer: "${userAnswer}"

Provide feedback in ${learningLanguage}. Do NOT use a numbered list in your response. Instead, write a cohesive response covering:
- Correct/Partially correct/Incorrect
- Brief language feedback
- Gentle corrections if needed

Keep it 2-4 sentences. Use markdown emphasis for key points.

Level guidance: ${levelDescription}`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt }, // CACHED
        { role: 'user', content: userPrompt }
      ],
      temperature: OPENAI_CONFIG.EVALUATION_TEMPERATURE,
    }));

    const feedback = response.choices[0]?.message?.content?.trim() ||
      `Error evaluating your answer. Please try again.`;

    if (DEV_LOGGING) {
      console.log(`✅ [EVAL] Feedback generated`);
    }

    return feedback;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return `Error evaluating your answer. Please try again.`;
  }
};