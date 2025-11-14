import { GoogleGenAI, Type } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function is the entry point for the serverless function.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure the request is a POST request.
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Load the API key from the secure environment variables.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { action, payload } = req.body;

    switch (action) {
      case 'generateTopicProposals': {
        const { interests, topicsToAvoid, count, learningLanguage, level, levelDescription } = payload;
        const prompt = `Based on the following interests: [${interests.join(', ')}], generate ${count} distinct and engaging article topic ideas for a language learner. IMPORTANT RULES: 1. The topics MUST be written in ${learningLanguage}. 2. The phrasing of the topics must be simple and appropriate for a language learner at the ${level} level. For guidance: ${levelDescription}. 3. The topics should be specific. 4. Do NOT generate topics that are the same as or very similar to any of the following: [${topicsToAvoid.join(', ')}].`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }] },
          config: {
            systemInstruction: `You are an assistant for a language learning app. Your goal is to generate creative and specific article topics. Return the response as a JSON object with a single key 'topics' which is an array of ${count} strings.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
        });
        res.status(200).json(JSON.parse(response.text));
        break;
      }
      
      case 'generateArticleStream': {
        const { topic, settings, levelDescription, wordCount } = payload;
        const prompt = `Write an article in ${settings.learningLanguage} about "${topic}". RULES: 1. The article MUST start with a suitable title on the very first line. 2. After the title, there MUST be a single newline character. 3. The article body should follow. 4. The content must be suitable for a language learner at the ${settings.level} level. Guidance: ${levelDescription}. 5. The article body should be approximately ${wordCount} words long. 6. Do not include any markdown formatting or introductory text.`;

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }] },
          config: {
            systemInstruction: `You are an expert language teacher creating reading materials for your students in ${settings.learningLanguage}.`,
            temperature: 0.7,
          },
        });

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of responseStream) {
          res.write(chunk.text);
        }
        res.end();
        break;
      }

      case 'translateWord': {
        const { word, from, to } = payload;
        const prompt = `Translate the word "${word}" from ${from} to ${to}. Provide only the single, most common translation. Do not add any explanation or extra text.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }] },
          config: { systemInstruction: 'You are a highly accurate and concise translator.', temperature: 0.1 },
        });
        res.status(200).json({ translation: response.text.trim() });
        break;
      }

      case 'generateQuizQuestion': {
        const { articleContent, learningLanguage, level, levelDescription } = payload;
        const prompt = `Based on the following article in ${learningLanguage}, create one open-ended comprehension question. RULES: 1. The question must be in ${learningLanguage}. 2. It must be answerable using only info from the article. 3. The language complexity must match a ${level} level. Guidance: ${levelDescription}. 4. The question should encourage a 1-2 sentence answer. 5. Return ONLY the question text. ARTICLE: --- ${articleContent} ---`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { systemInstruction: `You are a language teacher creating a comprehension quiz.`, temperature: 0.5 },
        });
        res.status(200).json({ question: response.text.trim() });
        break;
      }

      case 'evaluateQuizAnswer': {
        const { articleContent, question, userAnswer, learningLanguage, level, levelDescription } = payload;
        const prompt = `A language learner at the ${level} level was asked a question about an article. Evaluate their answer. ARTICLE CONTEXT: --- ${articleContent} --- QUESTION: "${question}" LEARNER'S ANSWER: "${userAnswer}" EVALUATION RULES: 1. Your entire response MUST be in ${learningLanguage}. 2. Write in a simple, encouraging tone for this level. Guidance: ${levelDescription}. 3. State if the answer is correct, partially correct, or incorrect. 4. Provide brief, constructive feedback on the language, gently correcting mistakes. 5. Keep your total feedback concise (2-4 sentences).`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { systemInstruction: `You are a friendly and helpful language tutor providing feedback on a quiz.`, temperature: 0.4 },
        });
        res.status(200).json({ feedback: response.text.trim() });
        break;
      }

      default:
        res.status(400).json({ error: 'Invalid action' });
        break;
    }
  } catch (error) {
    console.error('Error in API proxy:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}
