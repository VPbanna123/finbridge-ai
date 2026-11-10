import "dotenv/config";

const required = ["MONGO_URI", "JWT_SECRET"];
for (const k of required) {
  if (!process.env[k]) {
    console.warn(`[env] Missing required ${k}`);
  }
}

const normalizeExpiry = (value) => {
  if (!value) return "1d";
  // A plain number is treated as minutes ("15" -> "15m").
  if (/^\d+$/.test(value)) return `${value}m`;
  return value;
};

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Email verification (Resend)
  EMAIL_TOKEN_SECRET:
    process.env.EMAIL_TOKEN_SECRET ||
    process.env.Email_Token_Secret ||
    process.env.JWT_SECRET,
  EMAIL_TOKEN_EXPIRY: normalizeExpiry(
    process.env.EMAIL_TOKEN_EXPIRY || process.env.Email_Token_Expiry || "1d"
  ),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,

  // Cloudinary (blog images / whiteboard exports / profile photos)
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // AI chatbot (Groq primary, Gemini fallback)
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // Accept either `gemini-3.8-flash` or `models/gemini-3.8-flash`.
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.8-flash",
};
