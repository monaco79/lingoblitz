import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } from '@google/genai';

// Basic safety settings for all models
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The main handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;

    if (!action || !payload) {
        return res.status(400).json({ error: 'Missing action or payload' });
    }

    try {
        switch (action) {
            case 'generateTopicProposals':
                await handleGenerateTopicProposals(payload, res);
                break;
            case 'generateArticleStream':
                await handleGenerateArticleStream(payload, res);
                break;
            case 'translateWord':
                await handleTranslateWord(payload, res);
                break;
            case 'generateQuizQuestion':
                await handleGenerateQuizQuestion(payload, res);
                break;
            case 'evaluateQuizAnswer':
                await handleEvaluateQuizAnswer(payload, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error(`Error in action '${action}':`, error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}

// Handler for generating topic proposals
async function handleGenerateTopicProposals(payload: any, res: VercelResponse) {
    const { interests, topicsToAvoid, count, learningLanguage, level, levelDescription } = payload;
    if (!interests || !topicsToAvoid || !count || !learningLanguage || !level || !levelDescription) {
        return res.status(400).json({ error: 'Missing required fields for generating topic proposals' });
    }
    
    const prompt = `
      You are an expert curriculum designer for language learners.
      Generate ${count} interesting and specific article topics for a language learner.

      Learner Details:
      - Learning Language: ${learningLanguage}
      - Current Level: ${level} (${levelDescription})
      - Interests: ${interests.join(', ')}
      - Topics to AVOID (previously done): ${topicsToAvoid.join(', ') || 'None'}

      Instructions:
      1. Topics must be highly engaging and specific. Good: "The Secret History of the Espresso Machine". Bad: "Coffee".
      2. Ensure topics are appropriate for the learner's level.
      3. The topics should NOT be from the "Topics to AVOID" list.
      4. The response must be a JSON object.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            },
            safetySettings,
        }
    });
    
    try {
        const result = JSON.parse(response.text);
        res.status(200).json({ topics: result.topics || [] });
    } catch(e) {
        console.error("Failed to parse topics JSON from model:", response.text);
        res.status(500).json({ error: "Model returned invalid data for topics." });
    }
}

// Handler for streaming the article
async function handleGenerateArticleStream(payload: any, res: VercelResponse) {
    const { topic, settings, levelDescription, wordCount } = payload;
    if (!topic || !settings || !levelDescription || !wordCount) {
        return res.status(400).json({ error: 'Missing required fields for generating article' });
    }

    const prompt = `
      You are a language tutor creating a short, engaging article for a student.

      Article Topic: "${topic}"

      Student Profile:
      - Learning Language: ${settings.learningLanguage}
      - Native Language: ${settings.nativeLanguage}
      - Current Level: ${settings.level} (${levelDescription})

      Instructions:
      1. Write an article on the topic in ${settings.learningLanguage}.
      2. The article must be approximately ${wordCount} words long.
      3. The language complexity, vocabulary, and sentence structure MUST be strictly tailored to the student's ${settings.level} level.
      4. The first line of your response must be a short, captivating title for the article in ${settings.learningLanguage}.
      5. The rest of the response must be the body of the article.
      6. Do NOT use markdown or any special formatting.
      7. Do NOT add any extra text, explanations, or translations.
    `;
    
    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            safetySettings,
        }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    for await (const chunk of stream) {
        res.write(chunk.text);
    }
    res.end();
}

// Handler for translating a word
async function handleTranslateWord(payload: any, res: VercelResponse) {
    const { word, from, to } = payload;
    if (!word || !from || !to) {
        return res.status(400).json({ error: 'Missing required fields for translation' });
    }
    const prompt = `Translate the word "${word}" from ${from} to ${to}. Provide only the single, most common translation. Do not add any extra text or explanation.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { safetySettings }
    });
    
    const translation = response.text.trim();
    res.status(200).json({ translation });
}


// Handler for generating a quiz question
async function handleGenerateQuizQuestion(payload: any, res: VercelResponse) {
    const { articleContent, learningLanguage, level, levelDescription } = payload;
    if (!articleContent || !learningLanguage || !level || !levelDescription) {
        return res.status(400).json({ error: 'Missing required fields for generating quiz question' });
    }

    const prompt = `
      Based on the following article written in ${learningLanguage}, create one open-ended comprehension question.

      Article:
      """
      ${articleContent}
      """

      Instructions:
      1. The question must be in ${learningLanguage}.
      2. The question's difficulty must be appropriate for a ${level} (${levelDescription}) learner.
      3. The question should test understanding of the main ideas, not tiny details.
      4. Respond with ONLY the question text. Do not add labels like "Question:" or any other text.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { safetySettings }
    });
    
    const question = response.text.trim();
    res.status(200).json({ question });
}


// Handler for evaluating the quiz answer
async function handleEvaluateQuizAnswer(payload: any, res: VercelResponse) {
    const { articleContent, question, userAnswer, learningLanguage, level, levelDescription } = payload;
    if (!articleContent || !question || !userAnswer || !learningLanguage || !level || !levelDescription) {
        return res.status(400).json({ error: 'Missing required fields for evaluating quiz answer' });
    }

    const prompt = `
      You are a helpful and encouraging language tutor. A student has answered a quiz question about an article. Evaluate their answer.

      Student Profile:
      - Language: ${learningLanguage}
      - Level: ${level} (${levelDescription})

      Context:
      - Article: """${articleContent}"""
      - Question: "${question}"
      - Student's Answer: "${userAnswer}"

      Instructions:
      1. Assess if the student's answer is correct based on the article.
      2. Provide brief, constructive, and encouraging feedback in ${learningLanguage}.
      3. Keep the feedback simple and appropriate for the student's level.
      4. If the answer has grammatical mistakes, gently correct one or two major ones, but don't overwhelm the student.
      5. Start with a positive reinforcement like "Good job!" or "Great attempt!".
      6. Your entire response should be the feedback text only.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { safetySettings }
    });

    const feedback = response.text.trim();
    res.status(200).json({ feedback });
}
