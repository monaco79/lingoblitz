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
