import { chatGPT } from "../services/chatGPT.js";
import { findConv } from "../services/prisma.js";
import { messages } from "../utils/messages.js";
import { Ctx } from "../utils/types.js";

export async function start(ctx: Ctx) {
  const chatId = ctx.chat.id + "id";
  const conv = await findConv(chatId);
  const lang = conv ? conv.lang : "id-ID";

  await Promise.all([
    ctx.reply(messages.hello),
    ctx.sendChatAction("typing"),
    new Promise<void>(async (resolve) => {
      const reply = await chatGPT(
        `Untuk seterusnya, respon dalam bahasa ${lang}`,
        ctx.chat.id,
        conv?.conversationId,
        conv?.prevMessageId,
      );
      await ctx.reply(reply?.text || messages.unknownError);
      resolve();
    }),
  ]);
}
