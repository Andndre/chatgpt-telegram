import { default as express } from "express";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { BOT_TOKEN, PORT, WEB_APP_URL } from "./utils/env.js";
import { start } from "./commands/start.js";
import { lang } from "./commands/lang.js";
import { text } from "./events/text.js";
import { voice } from "./events/voice.js";

config();

const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.use(
  await bot.createWebhook({ domain: WEB_APP_URL }),
);

bot.command("start", start);

bot.command("lang", lang);

bot.on("text", text);

bot.on("voice", voice);

app.listen(PORT, () => {
  console.log("Bot is listening at port " + PORT);
});
