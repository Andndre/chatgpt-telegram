import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();

const api = new ChatGPTAPI({ apiKey: process.env.CHAT_GPT_API_KEY! });

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply("Hello! I'am ChatGPT.. how can I help you?");
});

bot.on("message", async (ctx) => {
  if (ctx.from.is_bot) return;
  const text = JSON.parse(JSON.stringify(ctx)).update.message.text as string;
  if (text.startsWith("/start")) return;

  ctx.sendChatAction("typing");

  const conversation = await prisma.conversation.findUnique({
    where: {
      chatId: ctx.chat.id + "id",
    },
  });

  let reply: ChatMessage;

  if (conversation) {
    reply = await api.sendMessage(text, {
      conversationId: conversation.conversationId,
      parentMessageId: conversation.prevMessageId,
    });
    await prisma.conversation.update({
      where: {
        chatId: ctx.chat.id + "id",
      },
      data: {
        prevMessageId: reply.id,
      },
    });
  } else {
    reply = await api.sendMessage(text);
    await prisma.conversation.create({
      data: {
        chatId: ctx.chat.id + "id",
        conversationId: reply.conversationId!,
        prevMessageId: reply.id,
      },
    });
  }

  await ctx.reply(reply.text);
});

bot.launch().then(() => {
  console.log("Bot started successfuly");
});
