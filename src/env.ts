import { config } from "dotenv";
config();

export const BOT_TOKEN = process.env.BOT_TOKEN!;
export const BOT_DEV_TOKEN = process.env.BOT_DEV_TOKEN!;
export const CHAT_GPT_API_KEY = process.env.CHAT_GPT_API_KEY!;
export const PORT = process.env.PORT || "80";
export const WEB_APP_URL = "chat-gpt-telegram-production.up.railway.app";
export const WEB_APP_DEV_URL = "http://localhost:" + PORT;
