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
        const { word, from, to } = await req.json();

        const systemPrompt = `You are a precise translator. Provide only the most common translations of the provided word. If the word has more than one meaning, list them seperated by comma. Provide no further explanations or articles. Do not capitalize the first letter unless it is grammatically required in the target language (e.g. nouns in German).`;
        const userPrompt = `Translate "${word}" from ${from} to ${to}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 50,
        });

        const translation = response.choices[0]?.message?.content?.trim() || "Translation unavailable";

        return new Response(JSON.stringify({ translation }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error translating word:', error);
        return new Response(JSON.stringify({ error: 'Failed to translate word' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
