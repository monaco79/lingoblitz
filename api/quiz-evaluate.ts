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
        const { articleContent, question, userAnswer, language, level } = await req.json();

        const systemPrompt = `You are a helpful language tutor. Evaluate the student's answer to the quiz question based on the article.
    Article: "${articleContent.substring(0, 500)}..." (truncated)
    Question: "${question}"
    Answer: "${userAnswer}"
    
    Provide feedback in ${language}. Do NOT use a numbered list in your response. Instead, write a cohesive response covering:
    - Correct/Partially correct/Incorrect
    - Brief language feedback
    - Gentle corrections if needed
    
    Keep it 2-4 sentences. Use markdown emphasis for key points.
    
    Level guidance: ${level}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt }
            ],
        });

        const feedback = response.choices[0]?.message?.content?.trim() || "Feedback unavailable.";

        return new Response(JSON.stringify({ feedback }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error evaluating quiz:', error);
        return new Response(JSON.stringify({ error: 'Failed to evaluate quiz' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
