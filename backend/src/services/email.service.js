import crypto from "crypto";
import { Resend } from "resend";
import { env } from "../config/env.js";

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;

let client = null;

export const isEmailConfigured = () =>
  Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);

const getClient = () => {
  if (!isEmailConfigured()) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
};

const DURATION_UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const parseDurationMs = (value, fallbackMs = 10 * 60 * 1000) => {
  const match = /^(\d+)(ms|s|m|h|d)?$/i.exec(String(value || "").trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = (match[2] || "m").toLowerCase();
  return Math.max(amount * (DURATION_UNITS[unit] || DURATION_UNITS.m), 60 * 1000);
};

export const getVerificationCodeExpiry = () =>
  new Date(Date.now() + parseDurationMs(env.EMAIL_TOKEN_EXPIRY));

export const generateVerificationCode = () =>
  String(crypto.randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)).padStart(
    VERIFICATION_CODE_LENGTH,
    "0"
  );

export const hashVerificationCode = (email, code) =>
  crypto
    .createHmac("sha256", env.EMAIL_TOKEN_SECRET)
    .update(`${String(email || "").toLowerCase().trim()}:${String(code || "").trim()}`)
    .digest("hex");

export const verificationCodeMatches = (email, code, storedHash) => {
  if (!storedHash || !code) return false;
  const candidate = Buffer.from(hashVerificationCode(email, code), "hex");
  const stored = Buffer.from(String(storedHash), "hex");
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const sendVerificationEmail = async ({ user, code }) => {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] Resend is not configured; skipping verification code email");
    return { sent: false, error: "not_configured" };
  }

  const name = escapeHtml(user.name || "there");
  const safeCode = escapeHtml(code);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a; margin: 0 0 12px;">Verify your FinBridge AI email</h2>
      <p style="color: #334155; line-height: 1.6;">Hi ${name},</p>
      <p style="color: #334155; line-height: 1.6;">
        Thanks for creating a FinBridge AI account. Enter this verification code
        to finish signing up:
      </p>
      <div style="margin: 26px 0; padding: 16px 20px; border-radius: 12px;
                  background: #eff6ff; border: 1px solid #bfdbfe; text-align: center;">
        <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px;
                     color: #1d4ed8; font-family: 'Courier New', monospace;">
          ${safeCode}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        This code expires in ${escapeHtml(env.EMAIL_TOKEN_EXPIRY)}. Do not share it
        with anyone. If you did not create this account, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = [
    `Hi ${user.name || "there"},`,
    "",
    "Thanks for creating a FinBridge AI account. Your verification code is:",
    "",
    code,
    "",
    `This code expires in ${env.EMAIL_TOKEN_EXPIRY}. Do not share it with anyone.`,
  ].join("\n");

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: "Your FinBridge AI verification code",
      html,
      text,
    });

    if (result?.error) {
      console.warn("[email] Resend rejected the message:", result.error?.message || result.error);
      return { sent: false, error: result.error?.message || "send_failed" };
    }
    return { sent: true };
  } catch (error) {
    // Never break registration or resend flows because of a mail provider issue.
    console.warn("[email] Failed to send verification code:", error?.message || error);
    return { sent: false, error: error?.message || "send_failed" };
  }
};
