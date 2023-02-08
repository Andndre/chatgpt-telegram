import { default as got } from "got";
import { messages } from "../utils/messages.js";
import { chatGPT } from "../services/chatGPT.js";
import { transcribe } from "../services/deepgram.js";
import { findConv } from "../services/prisma.js";
import { VoiceCtx } from "../utils/types.js";

export async function voice(ctx: VoiceCtx) {
  const conv = await findConv(ctx.chat.id + "id");
  const fileId = ctx.message.voice.file_id;
  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const voiceMessage = await got(fileUrl, { responseType: "buffer" });
  ctx.sendChatAction("typing");
  const transcription = await transcribe(
    voiceMessage.body,
    conv?.lang || "id-ID",
  );
  await Promise.all([
    ctx.reply("You said: " + transcription + "\n\nGetting ChatGPT's answer..."),
    ctx.sendChatAction("typing"),
    new Promise<void>(async (resolve) => {
      const reply = await chatGPT(
        transcription,
        ctx.chat.id,
        conv?.conversationId,
        conv?.prevMessageId,
      );
      await ctx.reply(reply?.text || messages.unknownError);
      resolve();
    }),
  ]);
}
