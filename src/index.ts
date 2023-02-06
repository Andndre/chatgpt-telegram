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

const errorMessageUnknown = "Something went wrong, please try again later...";

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
      const reply = await chatGPT(
        "Untuk seterusnya, respon dalam bahasa " +
          (convIfExist ? convIfExist.lang : "Indonesia"),
        ctx.chat.id,
        convIfExist?.conversationId,
        convIfExist?.prevMessageId,
      );

      await ctx.reply(reply?.text || errorMessageUnknown);
      resolve();
    }),
  ]);
});

bot.command("defaultlanguage", async (ctx) => {
  const [_, newLang] = ctx.message.text.split(" ");
  if (!newLang) {
    ctx.reply('To set new default language, use "/setlanguage [language]"');
    return;
  }
  const convIfExist = await prisma.conversation.findUnique({
    where: {
      chatId: ctx.chat.id + "id",
    },
  });

  if (convIfExist) {
    const reply = await chatGPT(
      'Untuk seterusnya, respon menggunakan bahasa "' + newLang + '"',
      ctx.chat.id,
      convIfExist.conversationId,
      convIfExist.prevMessageId,
    );
    if (!reply) {
      await ctx.reply(errorMessageUnknown);
      return;
    }
    await Promise.all([
      prisma.conversation.update({
        where: {
          chatId: ctx.chat.id + "id",
        },
        data: {
          lang: newLang,
        },
      }),
      ctx.reply(reply.text),
    ]);
  } else {
    const reply = await chatGPT(
      "Untuk seterusnya, respon menggunakan bahasa Indonesia",
      ctx.chat.id,
    );
    if (!reply) {
      ctx.reply(errorMessageUnknown);
      return;
    }
    await Promise.all([
      ctx.reply(reply.text),
      prisma.conversation.create({
        data: {
          chatId: ctx.chat.id + "id",
          lang: newLang,
          conversationId: reply.conversationId!,
          prevMessageId: reply.id,
        },
      }),
    ]);
  }
});

bot.on("text", async (ctx) => {
  if (ctx.from.is_bot) return;
  const text = ctx.message.text;
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

  await ctx.reply(
    reply?.text || errorMessageUnknown,
  );
});

async function chatGPT(
  message: string,
  chatId: number,
  convId: string | undefined = undefined,
  prevMessageId: string | undefined = undefined,
) {
  try {
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
  } catch (e: any) {
    console.log(e.message);
  }
}

app.listen(PORT, () => {
  console.log("Bot is listening at port " + PORT);
});
