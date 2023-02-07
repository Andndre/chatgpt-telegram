import { default as express } from "express";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { PrismaClient } from "@prisma/client";
import { BOT_TOKEN, CHAT_GPT_API_KEY, PORT, WEB_APP_URL } from "./env.js";

const errorMessageUnknown = "Something went wrong, please try again later...";

config();

const prisma = new PrismaClient();
const api = new ChatGPTAPI({ apiKey: CHAT_GPT_API_KEY });
const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.use(
  await bot.createWebhook({ domain: WEB_APP_URL }),
);

bot.start(async (ctx) => {
  const chatId = ctx.chat.id + "id";
  const conv = await prisma.conversation.findUnique({ where: { chatId } });
  const lang = conv ? conv.lang : "Indonesia";

  await Promise.all([
    ctx.reply("Hello! I'm ChatGPT.. how can I help you?"),
    new Promise<void>(async (resolve) => {
      const reply = await chatGPT(
        `Untuk seterusnya, respon dalam bahasa ${lang}`,
        ctx.chat.id,
        conv?.conversationId,
        conv?.prevMessageId,
      );
      await ctx.reply(reply?.text || errorMessageUnknown);
      resolve();
    }),
  ]);
});

bot.command("defaultlanguage", async (ctx) => {
  const [_, newLang = ""] = ctx.message.text.split(" ");
  if (!newLang) {
    ctx.reply('To set new default language, use "/defaultlanguage [language]"');
    return;
  }

  const chatId = ctx.chat.id + "id";
  const conv = await prisma.conversation.findUnique({ where: { chatId } });
  const reply = await chatGPT(
    `Untuk seterusnya, respon menggunakan bahasa "${newLang}"`,
    ctx.chat.id,
    conv?.conversationId,
    conv?.prevMessageId,
  );
  if (!reply) {
    ctx.reply(errorMessageUnknown);
    return;
  }

  await Promise.all([
    ctx.reply(reply.text),
    conv
      ? prisma.conversation.update({
        where: { chatId },
        data: { lang: newLang },
      })
      : prisma.conversation.create({
        data: {
          chatId,
          lang: newLang,
          conversationId: reply.conversationId!,
          prevMessageId: reply.id,
        },
      }),
  ]);
});

bot.on("text", async (ctx) => {
  if (ctx.from.is_bot) return;
  const text = ctx.message.text;
  ctx.sendChatAction("typing");
  if (text.startsWith("/")) return;

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

  await ctx.reply(
    reply?.text || errorMessageUnknown,
  );
});

async function chatGPT(
  message: string,
  chatId: number,
  convId?: string,
  prevMessageId?: string,
) {
  try {
    const id = chatId + "id";
    let reply: ChatMessage;
    if (convId) {
      reply = await api.sendMessage(message, {
        conversationId: convId,
        parentMessageId: prevMessageId,
      });
      await prisma.conversation.update({
        where: { chatId: id },
        data: { prevMessageId: reply.id },
      });
    } else {
      reply = await api.sendMessage(message);
      await prisma.conversation.create({
        data: {
          chatId: id,
          conversationId: reply.conversationId!,
          prevMessageId: reply.id,
        },
      });
    }
    return reply;
  } catch (e: any) {
    console.error(e.message);
  }
}

app.listen(PORT, () => {
  console.log("Bot is listening at port " + PORT);
});
