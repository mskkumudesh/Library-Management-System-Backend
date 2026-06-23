import { Response } from "express";
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";
import Book from "../models/Book";
import { AuthRequest } from "../middleware/auth";
import { getGeminiClient } from "../config/gemini";

const SYSTEM_PROMPT = `You are the ShelfScan Library Assistant, a friendly chatbot that helps library
members find books and answer basic questions about borrowing.

Rules:
- When a member asks about a book, topic, author, or genre, ALWAYS use the search_catalog tool
  before answering — never invent book titles or guess what's in the catalog.
- Recommend only books that actually appear in search_catalog results. If nothing matches, say so
  honestly and suggest the member try a different search or check back later.
- Mention how many copies are currently available when relevant.
- Keep answers short and conversational — this is a chat widget, not an essay.
- You can also answer general questions about how borrowing works (14-day loan period, late fines
  of $0.50/day) without needing to search the catalog.`;

const searchCatalogDeclaration: FunctionDeclaration = {
  name: "search_catalog",
  description:
    "Search the library's book catalog by keyword (matches title, author, or category) and/or category. Returns matching books with availability.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "Free-text search term — title, author name, or topic keyword.",
      },
      category: {
        type: SchemaType.STRING,
        description: "Optional exact category filter, e.g. 'Fiction', 'Science'.",
      },
    },
  },
};

async function runCatalogSearch(args: { query?: string; category?: string }) {
  const filter: Record<string, unknown> = {};
  if (args.category) {
    filter.category = args.category;
  }
  if (args.query) {
    filter.$or = [
      { title: { $regex: args.query, $options: "i" } },
      { author: { $regex: args.query, $options: "i" } },
      { category: { $regex: args.query, $options: "i" } },
    ];
  }

  const books = await Book.find(filter).limit(8).select("title author category availableCopies totalCopies");

  return books.map((b) => ({
    title: b.title,
    author: b.author,
    category: b.category,
    availableCopies: b.availableCopies,
    totalCopies: b.totalCopies,
  }));
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// POST /api/chat  { message, history? }  (any logged-in user)
export const chatWithBot = async (req: AuthRequest, res: Response) => {
  try {
    const genAI = getGeminiClient();
    if (!genAI) {
      return res.status(503).json({ message: "The chatbot isn't configured yet (missing GEMINI_API_KEY)." });
    }

    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: [searchCatalogDeclaration] }],
    });

    // Gemini uses "model" instead of "assistant" for the bot's own turns
    const mappedHistory = (history || []).slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: mappedHistory });

    let result = await chat.sendMessage(message);
    let response = result.response;
    let functionCalls = response.functionCalls();

    // Tool-call loop (model can call search_catalog, we run it, feed results back, ask again)
    let loopGuard = 0;
    while (functionCalls && functionCalls.length > 0 && loopGuard < 3) {
      loopGuard += 1;
      const call = functionCalls[0];

      const toolResult =
        call.name === "search_catalog"
          ? await runCatalogSearch(call.args as { query?: string; category?: string })
          : null;

      const responseBody =
        toolResult && toolResult.length > 0
          ? toolResult
          : { message: toolResult ? "No matching books found." : "Unknown tool" };

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: { result: responseBody },
          },
        },
      ] as any);

      response = result.response;
      functionCalls = response.functionCalls();
    }

    return res.status(200).json({ reply: response.text() });
  } catch (err) {
    console.error("Chatbot request failed:", err);
    return res.status(500).json({ message: "Chatbot request failed", error: (err as Error).message });
  }
};
