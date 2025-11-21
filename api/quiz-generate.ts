import { OpenAI } from 'openai';

export const config = {
    runtime: 'edge',
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { articleContent, language, level } = await req.json();

        const systemPrompt = `You are a language teacher. Create ONE multiple-choice question based on the provided article to test comprehension.
    The question and answers should be in ${language} and appropriate for ${level} level.
    Format:
    Question
    A) Option 1
    B) Option 2
    C) Option 3
    D) Option 4
    
    Do not indicate the correct answer yet.`;

        const userPrompt = `Article:\n${articleContent}\n\nGenerate the question now.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
        });

        const question = response.choices[0]?.message?.content?.trim() || "Quiz generation failed.";

        return new Response(JSON.stringify({ question }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error generating quiz:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate quiz' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
