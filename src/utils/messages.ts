export const messages = {
  unknownError: "Something went wrong, please try again later...",
  hello: "Hello! I'm ChatGPT.. how can I help you?",
  invalidLangUsage:
    'To set new default language, use "/lang [IETF_LangTag]"\n\nIETF_LangTag example:\nid\nid-ID\nen-US\nja\n\nMore about IETF Language Tag: https://en.wikipedia.org/wiki/IETF_language_tag',
  invalidIETF:
    "Invalid IETF_LangTag!\n\nexample (for Indonesian): /lang id-ID\n\nMore about IETF Language Tag: https://en.wikipedia.org/wiki/IETF_language_tag",
  transcribeFailed: "Failed to transcribe your voice..",
} as const;
