import client from "./client";

export const sendMessage = (payload) => client.post("/chat/send", payload);
export const getHistory = (sessionId) =>
  client.get("/chat/history", { params: { sessionId } });
export const listSessions = () => client.get("/chat/sessions");
export const geminiStatus = () => client.get("/chat/status");
