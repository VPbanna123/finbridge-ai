import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ChatSession } from "../models/Chat.js";
import { ApiError } from "../utils/ApiError.js";

const GEMINI_API_KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
// Gemini accepts a model resource such as `models/gemini-3.8-flash`, while the
// generateContent URL supplies the `models/` path segment itself. Normalising
// here prevents the easy-to-miss `models/models/...` URL error.
const GEMINI_MODEL = (env.GEMINI_MODEL || "gemini-3.8-flash").replace(/^models\//, "");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

const MAX_HISTORY_MESSAGES = 10;

const isGeminiConfigured = () => Boolean(GEMINI_API_KEY);

const buildSystemPrompt = (user) => {
  const name = user?.name || "there";
  const email = user?.email || "";
  const ageGroup = user?.ageGroup || "not shared";
  const occupation = user?.occupation || "not shared";
  const incomeRange = user?.incomeRange || "not shared";
  const state = user?.state || "not shared";
  const city = user?.city || "not shared";
  const language = user?.language || "en";
  const financialGoals = Array.isArray(user?.financialGoals)
    ? user.financialGoals.join(", ")
    : "not shared";
  const riskPreference = user?.riskPreference || "not shared";

  return `You are FinBridge AI's finance assistant chatbot. You help users with personal finance, government schemes, budgeting, savings, investments, taxes, and financial planning in India.

User context (from their FinBridge profile):
- Name: ${name}
- Email: ${email}
- Age group: ${ageGroup}
- Occupation: ${occupation}
- Income range: ${incomeRange}
- State: ${state}
- City: ${city}
- Preferred language: ${language}
- Financial goals: ${financialGoals}
- Risk preference: ${riskPreference}

Instructions:
- Answer in the user's preferred language when possible (${language}).
- Be helpful, accurate, and concise.
- Focus on Indian personal finance and government schemes.
- If you don't know something, say so honestly.
- Do not give regulated investment advice; suggest consulting a qualified financial advisor for major decisions.
- Keep a friendly, supportive tone.`;
};

const getUserContext = async (userId) => {
  const user = await User.findById(userId).select(
    "name email ageGroup occupation incomeRange state city language financialGoals riskPreference"
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

const getOrCreateSession = async (userId, sessionId) => {
  if (sessionId) {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (session) return session;
  }
  return ChatSession.create({ userId, title: "New Chat", messages: [] });
};

const getRecentMessages = (messages, limit = MAX_HISTORY_MESSAGES) => {
  return messages.slice(-limit);
};

const buildGeminiContents = (systemPrompt, recentMessages, userMessage) => {
  const contents = [];
  if (systemPrompt) {
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I am your FinBridge AI finance assistant. How can I help you today?" }],
    });
  }
  for (const m of recentMessages) {
    contents.push({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });
  return contents;
};

const callGemini = async (contents) => {
  if (!isGeminiConfigured()) {
    throw new ApiError(500, "Gemini AI is not configured", [], "GEMINI_NOT_CONFIGURED");
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || "Gemini request failed";
      throw new ApiError(502, msg, [], "GEMINI_ERROR");
    }

    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new ApiError(502, "No response from Gemini", [], "GEMINI_EMPTY");
    }
    return text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "Failed to reach Gemini AI", [], "GEMINI_ERROR");
  }
};

export const sendChatMessage = async ({ userId, sessionId, message }) => {
  if (!message || !message.trim()) {
    throw new ApiError(400, "Message is required");
  }

  const user = await getUserContext(userId);
  const session = await getOrCreateSession(userId, sessionId);

  const systemPrompt = buildSystemPrompt(user);
  const recentMessages = getRecentMessages(session.messages, MAX_HISTORY_MESSAGES);
  const contents = buildGeminiContents(systemPrompt, recentMessages, message.trim());

  const aiResponse = await callGemini(contents);

  // Save user message + model response
  session.messages.push(
    { role: "user", content: message.trim() },
    { role: "model", content: aiResponse }
  );
  session.updatedAt = new Date();
  if (!session.title || session.title === "New Chat") {
    session.title = message.trim().slice(0, 60);
  }
  await session.save();

  return {
    sessionId: session._id,
    message: aiResponse,
    title: session.title,
  };
};

export const getChatHistory = async ({ userId, sessionId }) => {
  const session = await ChatSession.findOne({ _id: sessionId, userId }).select(
    "title messages updatedAt"
  );
  if (!session) throw new ApiError(404, "Chat session not found");
  return session;
};

export const getUserChatSessions = async (userId) => {
  return ChatSession.find({ userId })
    .select("title updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50);
};

export const isGeminiConfiguredStatus = () => isGeminiConfigured();

export const getGeminiStatus = () => ({
  configured: isGeminiConfigured(),
  model: `models/${GEMINI_MODEL}`,
});
