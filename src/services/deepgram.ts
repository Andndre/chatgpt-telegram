import pkg from "@deepgram/sdk";
import { DEEPGRAM_API_KEY } from "../utils/env.js";
import { messages } from "../utils/messages.js";
const { Deepgram } = pkg;

export const transcribe = async (buffer: Buffer, IETF_LangTag: string) => {
  const deepgram = new Deepgram(DEEPGRAM_API_KEY);

  const response = await deepgram.transcription.preRecorded(
    { buffer, mimetype: "audio/wav" },
    { punctuate: true, language: IETF_LangTag, times: true },
  );

  const { results } = response;

  if (!results) {
    return messages.unknownError;
  }

  const transcription = results.channels
    ?.map((result) => {
      const { alternatives } = result;
      if (!alternatives) return "";
      return alternatives[0].transcript;
    })
    .join("\n");
  return transcription;
};
