import TelegramBot from 'node-telegram-bot-api';
import { dbGet } from '../database';

let botInstance: TelegramBot | null = null;
let currentToken: string = '';

const getBot = async (): Promise<TelegramBot | null> => {
  const tokenRow = await dbGet("SELECT value FROM settings WHERE key = 'telegram_bot_token'");
  const token = tokenRow?.value;

  if (!token) return null;

  if (botInstance && currentToken === token) {
    return botInstance;
  }

  currentToken = token;
  botInstance = new TelegramBot(token, { polling: false });
  return botInstance;
};

export const sendTelegramNotification = async (message: string) => {
  try {
    const chatRow = await dbGet("SELECT value FROM settings WHERE key = 'telegram_chat_id'");
    const chatId = chatRow?.value;

    if (!chatId) return;

    const bot = await getBot();
    if (!bot) return;

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
