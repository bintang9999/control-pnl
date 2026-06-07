"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const genai_1 = require("@google/genai");
const auth_1 = require("../middleware/auth");
const database_1 = require("../database");
const router = express_1.default.Router();
router.post('/chat', auth_1.requireAuth, async (req, res) => {
    try {
        const { message, context } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const apiKeyRow = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'ai_api_key'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) {
            return res.status(400).json({ error: 'AI API Key is not configured in Settings' });
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
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
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process AI request' });
    }
});
exports.default = router;
