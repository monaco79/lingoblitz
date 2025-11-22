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

        const systemPrompt = `You are a language teacher. Create ONE open-ended question based on the provided article to test comprehension.
    The question should be in ${language} and appropriate for ${level} level.
    
    Guidelines for difficulty:
    - Beginner (A1-A2): Simple, direct questions about facts stated clearly in the text.
    - Intermediate (B1-B2): Questions requiring some inference or connecting ideas.
    - Advanced (C1-C2): Complex questions about themes, opinions, or subtle details.

    Do NOT create multiple choice options. Just the question.`;

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
