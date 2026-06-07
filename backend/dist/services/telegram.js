"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramNotification = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const database_1 = require("../database");
let botInstance = null;
let currentToken = '';
const getBot = async () => {
    const tokenRow = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'telegram_bot_token'");
    const token = tokenRow?.value;
    if (!token)
        return null;
    if (botInstance && currentToken === token) {
        return botInstance;
    }
    currentToken = token;
    botInstance = new node_telegram_bot_api_1.default(token, { polling: false });
    return botInstance;
};
const sendTelegramNotification = async (message) => {
    try {
        const chatRow = await (0, database_1.dbGet)("SELECT value FROM settings WHERE key = 'telegram_chat_id'");
        const chatId = chatRow?.value;
        if (!chatId)
            return;
        const bot = await getBot();
        if (!bot)
            return;
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
    catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
};
exports.sendTelegramNotification = sendTelegramNotification;
