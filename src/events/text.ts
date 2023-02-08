import { messages } from "../utils/messages.js";
import { chatGPT } from "../services/chatGPT.js";
import { findConv } from "../services/prisma.js";
import { Ctx } from "../utils/types.js";

export async function text(ctx: Ctx) {
  if (ctx.from.is_bot) return;
  const text = ctx.message.text;
  ctx.sendChatAction("typing");
  if (text.startsWith("/")) return;

  const conversation = await findConv(ctx.chat.id + "id");

  const reply = await chatGPT(
    text,
    ctx.chat.id,
    conversation?.conversationId,
    conversation?.prevMessageId,
  );

  await ctx.reply(
    reply?.text || messages.unknownError,
  );
}
