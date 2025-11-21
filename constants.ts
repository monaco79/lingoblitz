// Last updated: 2025-11-16 20:30
// Added TTS-related constants

import { Language, Level, Topic } from './types';

export const ALL_LANGUAGES: Language[] = Object.values(Language);
export const ALL_LEVELS: Level[] = Object.values(Level);
export const ALL_TOPICS: Topic[] = Object.values(Topic);

export const LEVEL_DESCRIPTIONS: { [key in Level]: string } = {
  [Level.AbsoluteBeginner]: "Use only the most basic 20-50 words and simple 'Subject-Verb-Object' sentences in the present tense. Avoid complex grammar entirely.",
  [Level.A1]: "Focus on present tense, basic adjectives, and common nouns related to daily life. Use short, simple sentences.",
  [Level.A2]: "Continue with simple sentences but introduce the simple past tense (e.g., 'I went', 'she saw'). Expand vocabulary to common situations.",
  [Level.B1]: "Introduce past and future tenses, more complex sentences with conjunctions like 'because', 'so', 'but', and a wider range of everyday vocabulary.",
  [Level.B2]: "Use a mix of tenses including perfect and conditional. Introduce more nuanced vocabulary and some common idiomatic expressions. Sentences can be longer and more complex.",
  [Level.C1]: "Use advanced and nuanced vocabulary, complex grammatical structures, idiomatic expressions, and a formal or informal tone as appropriate for the topic. Assume a high level of comprehension.",
};

export const LEVEL_WORD_COUNTS: { [key in Level]: number } = {
  [Level.AbsoluteBeginner]: 50,
  [Level.A1]: 80,
  [Level.A2]: 150,
  [Level.B1]: 250,
  [Level.B2]: 350,
  [Level.C1]: 450,
};

// TTS Speed defaults based on level
export const LEVEL_TTS_SPEEDS: { [key in Level]: number } = {
  [Level.AbsoluteBeginner]: 0.6,
  [Level.A1]: 0.7,
  [Level.A2]: 0.8,
  [Level.B1]: 0.9,
  [Level.B2]: 1.0,
  [Level.C1]: 1.1,
};

// Azure TTS locale mapping
export const LANGUAGE_TO_LOCALE: { [key in Language]: string } = {
  [Language.English]: 'en-US',
  [Language.Spanish]: 'es-ES',
  [Language.French]: 'fr-FR',
  [Language.German]: 'de-DE',
  [Language.Italian]: 'it-IT',
  [Language.Portuguese]: 'pt-PT',
  [Language.Japanese]: 'ja-JP',
  [Language.Chinese]: 'zh-CN',
};

// Sample sentences for TTS preview in each language
export const TTS_SAMPLE_SENTENCES: { [key in Language]: string } = {
  [Language.English]: 'Welcome to LingoBlitz! This is how I sound.',
  [Language.Spanish]: '¡Bienvenido a LingoBlitz! Así es como sueno.',
  [Language.French]: 'Bienvenue à LingoBlitz! Voici comment je sonne.',
  [Language.German]: 'Willkommen bei LingoBlitz! So klinge ich.',
  [Language.Italian]: 'Benvenuto a LingoBlitz! Ecco come suono.',
  [Language.Portuguese]: 'Bem-vindo ao LingoBlitz! É assim que eu soo.',
  [Language.Japanese]: 'LingoBlitzへようこそ！これが私の声です。',
  [Language.Chinese]: '欢迎来到LingoBlitz！这就是我的声音。',
};

// OpenAI Configuration
export const OPENAI_CONFIG = {
  MODEL: 'gpt-4o' as const,
  FALLBACK_MODEL: 'gpt-4o-mini' as const,
  
  // Temperature settings per use-case
  ARTICLE_TEMPERATURE: 0.6,
  TRANSLATION_TEMPERATURE: 0.1,
  QUIZ_TEMPERATURE: 0.5,
  EVALUATION_TEMPERATURE: 0.4,
  TOPIC_TEMPERATURE: 0.7,
} as const;