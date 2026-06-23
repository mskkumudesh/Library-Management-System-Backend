import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;
let warnedMissingConfig = false;

export const getGeminiClient = (): GoogleGenerativeAI | null => {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    if (!warnedMissingConfig) {
      console.warn("GEMINI_API_KEY is not set — the chatbot endpoint will return an error.");
      warnedMissingConfig = true;
    }
    return null;
  }

  client = new GoogleGenerativeAI(apiKey);
  return client;
};
