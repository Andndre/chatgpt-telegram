-- CreateTable
CREATE TABLE "Conversation" (
    "chatId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "prevMessageId" TEXT NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("chatId")
);
