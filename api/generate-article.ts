import { LEVEL_DESCRIPTIONS, LEVEL_WORD_COUNTS } from '../constants';
import { Level } from '../types';
import { GoogleGenerativeAI } from '@google/genai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(req: Request) {
    try {
        const { topic, settings } = await req.json();
        const level = settings.level as Level;
        const language = settings.learningLanguage;

        const levelDescription = LEVEL_DESCRIPTIONS[level] || "Simple language";
        const wordCount = LEVEL_WORD_COUNTS[level] || 100;

        const prompt = `
    Write a short, engaging article in ${language} about "${topic}".
    The article should be suitable for a language learner at ${levelDescription} level (CEFR ${level}).
    
    Target length: approximately ${wordCount} words.
    
    Format:
    Title
    
    [Paragraph 1]
    
    [Paragraph 2]
    
    [Paragraph 3]
    
    Structure the article with clear paragraphs separated by double newlines.
    No markdown formatting.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ content: text }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating article:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate article' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
