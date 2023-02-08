import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function updateConv(id: string, prevMessageId: string) {
  return await prisma.conversation.update({
    where: { chatId: id },
    data: { prevMessageId: prevMessageId },
  });
}

export async function createNewConv(
  id: string,
  conversationId: string,
  prevMessageId: string,
) {
  return await prisma.conversation.create({
    data: {
      chatId: id,
      conversationId,
      prevMessageId,
    },
  });
}

export async function findConv(id: string) {
  return await prisma.conversation.findUnique({ where: { chatId: id } });
}

export async function updateLang(id: string, newLang: string) {
  return await prisma.conversation.update({
    where: {
      chatId: id,
    },
    data: {
      lang: newLang,
    },
  });
}
