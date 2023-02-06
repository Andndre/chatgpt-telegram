import { default as express } from "express";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { PrismaClient } from "@prisma/client";
import {
  BOT_DEV_TOKEN,
  BOT_TOKEN,
  CHAT_GPT_API_KEY,
  PORT,
  WEB_APP_DEV_URL,
  WEB_APP_URL,
} from "./env.js";

config();

const prisma = new PrismaClient();

const api = new ChatGPTAPI({ apiKey: CHAT_GPT_API_KEY });

const app = express();

const environment = app.get("env") as string;

console.log(environment);

const prod = environment === "production";

const bot = new Telegraf(prod ? BOT_TOKEN : BOT_DEV_TOKEN);

app.use(
  await bot.createWebhook({ domain: prod ? WEB_APP_URL : WEB_APP_DEV_URL }),
);

bot.start(async (ctx) => {
  await Promise.all([
    ctx.reply("Hello! I'am ChatGPT.. how can I help you?"),
    new Promise<void>(async (resolve) => {
      const convIfExist = await prisma.conversation.findUnique({
        where: {
          chatId: ctx.chat.id + "id",
        },
      });
      await chatGPT(
        "Untuk seterusnya, respon dalam bahasa " +
          (convIfExist ? convIfExist.lang : "Indonesia"),
        ctx.chat.id,
        convIfExist?.conversationId,
        convIfExist?.prevMessageId,
      );
      resolve();
    }),
  ]);
});

bot.on("message", async (ctx) => {
  if (ctx.from.is_bot) return;
  const text = JSON.parse(JSON.stringify(ctx)).update.message.text as string;
  if (text.startsWith("/")) return;

  ctx.sendChatAction("typing");

  const conversation = await prisma.conversation.findUnique({
    where: {
      chatId: ctx.chat.id + "id",
    },
  });

  const reply = await chatGPT(
    text,
    ctx.chat.id,
    conversation?.conversationId,
    conversation?.prevMessageId,
  );

  await ctx.reply(reply.text);
});

async function chatGPT(
  message: string,
  chatId: number,
  convId: string | undefined = undefined,
  prevMessageId: string | undefined = undefined,
) {
  let reply: ChatMessage;
  if (convId) {
    reply = await api.sendMessage(message, {
      conversationId: convId,
      parentMessageId: prevMessageId,
    });
    await prisma.conversation.update({
      where: {
        chatId: chatId + "id",
      },
      data: {
        prevMessageId: reply.id,
      },
    });
  } else {
    reply = await api.sendMessage(message);
    await prisma.conversation.create({
      data: {
        chatId: chatId + "id",
        conversationId: reply.conversationId!,
        prevMessageId: reply.id,
      },
    });
  }

  return reply;
}

app.listen(PORT, () => {
  console.log("Bot is listening at port " + PORT);
});
