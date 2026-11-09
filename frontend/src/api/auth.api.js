import client from "./client";

export const register = (payload) => client.post("/auth/register", payload);
export const login = (payload) => client.post("/auth/login", payload);
export const me = () => client.get("/auth/me");
export const verifyEmail = ({ email, code }) =>
  client.post("/auth/verify-email", { email, code });
export const resendVerification = (email) =>
  client.post("/auth/resend-verification", { email });
