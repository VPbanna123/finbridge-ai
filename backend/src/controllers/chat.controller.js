import {
  sendChatMessage,
  getChatHistory,
  getUserChatSessions,
  getGeminiStatus,
} from "../services/chat.service.js";
import { HTTP_STATUS } from "../utils/constants.js";

export const sendMessage = async (req, res) => {
  const { sessionId, message } = req.body;
  const userId = req.user.id;

  const result = await sendChatMessage({ userId, sessionId, message });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Message sent",
    data: result,
  });
};

export const getHistory = async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user.id;

  const session = await getChatHistory({ userId, sessionId });
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Chat history",
    data: session,
  });
};

export const listSessions = async (req, res) => {
  const userId = req.user.id;
  const sessions = await getUserChatSessions(userId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Chat sessions",
    data: sessions,
  });
};

export const geminiStatus = async (_req, res) => {
  const status = getGeminiStatus();
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: status,
  });
};
