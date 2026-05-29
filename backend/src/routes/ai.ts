import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { dbGet } from '../database';

const router = express.Router();

router.post('/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKeyRow = await dbGet("SELECT value FROM settings WHERE key = 'ai_api_key'");
    const apiKey = apiKeyRow?.value;

    if (!apiKey) {
      return res.status(400).json({ error: 'AI API Key is not configured in Settings' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = "Anda adalah MidoPanel Assistant, asisten AI untuk control panel server yang berjalan di Alpine Linux. Anda HARUS selalu menjawab menggunakan Bahasa Indonesia. Jaga jawaban Anda agar tetap singkat, padat, sangat membantu, dan diformat menggunakan markdown.";
    
    if (context) {
      systemInstruction += `\n\nCurrent Server Context:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI request' });
  }
});

export default router;
