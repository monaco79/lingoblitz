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
        const { topic, settings } = await req.json();

        const levelDescription = settings.level; // You might want to map this if needed, but passing the string is fine
        const wordCount = settings.level === 'Absolute Beginner' ? 100 :
            settings.level === 'A1 (Beginner)' ? 150 :
                settings.level === 'A2 (Elementary)' ? 200 :
                    settings.level === 'B1 (Intermediate)' ? 250 :
                        settings.level === 'B2 (Upper Intermediate)' ? 300 : 350;

        const systemPrompt = `You are a helpful language tutor. Write an article about "${topic}" for a student with ${settings.level} level in ${settings.learningLanguage}.`;

        const userPrompt = `REQUIREMENTS:
- Target level: ${settings.level}
- Level description: ${levelDescription}
- Target word count: ${wordCount} words
- Format: Title on first line, then newline, then article body
- Structure the article with clear paragraphs separated by double newlines
- No markdown formatting

Write the article now.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            stream: true,
        });

        // Convert the response to a ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Error generating article:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate article' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
