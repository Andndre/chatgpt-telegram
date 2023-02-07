-- CreateTable
CREATE TABLE "Conversation" (
    "chatId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "prevMessageId" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'id-ID',

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("chatId")
);
