import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { CHAT_GPT_API_KEY } from "../utils/env.js";
import { createNewConv, updateConv } from "./prisma.js";

const api = new ChatGPTAPI({ apiKey: CHAT_GPT_API_KEY });

export async function chatGPT(
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
      await updateConv(id, reply.id);
    } else {
      reply = await api.sendMessage(message);
      await createNewConv(id, reply.conversationId!, reply.id);
    }
    return reply;
  } catch (e: any) {
    console.error(e.message);
  }
}
