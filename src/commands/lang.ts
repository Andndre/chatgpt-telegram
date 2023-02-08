import { messages } from "../utils/messages.js";
import { chatGPT } from "../services/chatGPT.js";
import { findConv, prisma, updateLang } from "../services/prisma.js";
import { Ctx } from "../utils/types.js";

export async function lang(ctx: Ctx) {
  const [_, newLang = ""] = ctx.message.text.split(" ");
  if (!newLang) {
    ctx.reply(
      messages.invalidLangUsage,
    );
    return;
  }

  const validator = /^[a-z]{2,3}(-[A-Z]{2,3}){0,1}$/;

  if (!validator.test(newLang)) {
    ctx.reply(
      messages.invalidIETF,
    );
    return;
  }

  const chatId = ctx.chat.id + "id";
  const conv = await findConv(chatId);
  const reply = await chatGPT(
    `Untuk seterusnya, respon menggunakan bahasa "${newLang}"`,
    ctx.chat.id,
    conv?.conversationId,
    conv?.prevMessageId,
  );
  if (!reply) {
    ctx.reply(messages.unknownError);
    return;
  }

  await Promise.all([
    ctx.reply(reply.text),
    conv ? updateLang(chatId, newLang) : prisma.conversation.create({
      data: {
        chatId,
        lang: newLang,
        conversationId: reply.conversationId!,
        prevMessageId: reply.id,
      },
    }),
  ]);
}
