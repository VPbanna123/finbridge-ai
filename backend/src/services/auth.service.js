import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  VERIFICATION_CODE_MAX_ATTEMPTS,
  generateVerificationCode,
  getVerificationCodeExpiry,
  hashVerificationCode,
  isEmailConfigured,
  sendVerificationEmail,
  verificationCodeMatches,
} from "./email.service.js";
import { isCloudinaryConfigured, uploadDataImage } from "./cloudinary.service.js";

export const signToken = (userId) =>
  jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const clearVerificationCode = (user) => {
  user.emailVerificationCodeHash = undefined;
  user.emailVerificationCodeExpiresAt = undefined;
  user.emailVerificationAttempts = 0;
};

const issueVerificationCode = async (user) => {
  const code = generateVerificationCode();
  user.emailVerificationCodeHash = hashVerificationCode(user.email, code);
  user.emailVerificationCodeExpiresAt = getVerificationCodeExpiry();
  user.emailVerificationAttempts = 0;
  user.emailVerificationSentAt = new Date();
  await user.save();
  return sendVerificationEmail({ user, code });
};

export const registerUser = async ({ name, email, password, profileImage }) => {
  if (!name || !email || !password || password.length < 8) {
    throw new ApiError(400, "Name, email and 8+ character password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Pre-check for friendly 409
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new ApiError(409, "Email already registered");

  const emailEnabled = isEmailConfigured();

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      // Verification is only enforced when a mailer is configured. Without it
      // the account is usable immediately instead of locking the user out.
      emailVerified: !emailEnabled,
      emailVerifiedAt: emailEnabled ? undefined : new Date(),
    });

    // Optional profile photo captured on the registration screen. Upload is
    // best-effort: a bad image or missing Cloudinary config must never stop
    // account creation.
    if (profileImage && isCloudinaryConfigured()) {
      try {
        user.profileImage = await uploadDataImage(profileImage, "finbridge-avatars");
        await user.save();
      } catch (error) {
        console.warn("[profile-image] Registration upload skipped:", error?.message || error);
      }
    }

    let emailSent = false;
    if (emailEnabled) {
      const result = await issueVerificationCode(user);
      emailSent = result.sent;
      if (!emailSent) {
        // Mail delivery failed: keep the account usable rather than showing an
        // error or trapping the user behind a code they never received.
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        clearVerificationCode(user);
        await user.save();
      }
    }

    const safe = user.toSafeObject();
    const requiresVerification = user.emailVerified === false;
    return {
      token: requiresVerification ? null : signToken(user.id),
      user: safe,
      requiresVerification,
      emailSent,
    };
  } catch (err) {
    // Handle race-case duplicate (concurrent requests) + legacy username index
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      if (field === "email") throw new ApiError(409, "Email already registered");
      if (field === "username") {
        // Legacy orphan index – should have been dropped by connectDB cleanup
        throw new ApiError(
          500,
          "Database index misconfiguration (username_1). Please contact support / drop orphan index."
        );
      }
      throw new ApiError(409, `${field} already exists`);
    }
    throw err;
  }
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  // passwordHash is select:false so explicitly include
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash"
  );
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Only block accounts created after mail verification was enabled. Older
  // accounts have no emailVerificationSentAt and remain usable.
  if (user.emailVerified === false && user.emailVerificationSentAt) {
    throw new ApiError(
      403,
      "Please verify your email address before signing in.",
      [],
      "EMAIL_NOT_VERIFIED"
    );
  }

  const safe = user.toSafeObject();
  return { token: signToken(user.id), user: safe };
};

export const verifyEmail = async ({ email, code } = {}) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const normalizedCode = String(code || "").trim();
  if (!normalizedEmail || !normalizedCode) {
    throw new ApiError(
      400,
      "Email and verification code are required",
      [],
      "VERIFICATION_CODE_REQUIRED"
    );
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationCodeHash"
  );
  if (!user) {
    throw new ApiError(
      400,
      "Invalid or expired verification code.",
      [],
      "INVALID_VERIFICATION_CODE"
    );
  }

  if (user.emailVerified === true) {
    throw new ApiError(
      400,
      "This email is already verified. Please sign in.",
      [],
      "EMAIL_ALREADY_VERIFIED"
    );
  }

  const attempts = Number(user.emailVerificationAttempts) || 0;
  if (attempts >= VERIFICATION_CODE_MAX_ATTEMPTS) {
    throw new ApiError(
      429,
      "Too many incorrect attempts. Please request a new code.",
      [],
      "VERIFICATION_TOO_MANY_ATTEMPTS"
    );
  }

  const expiresAt = user.emailVerificationCodeExpiresAt
    ? new Date(user.emailVerificationCodeExpiresAt).getTime()
    : 0;
  if (!expiresAt || expiresAt <= Date.now()) {
    throw new ApiError(
      400,
      "This verification code has expired. Please request a new one.",
      [],
      "VERIFICATION_CODE_EXPIRED"
    );
  }

  if (
    !verificationCodeMatches(
      user.email,
      normalizedCode,
      user.emailVerificationCodeHash
    )
  ) {
    user.emailVerificationAttempts = attempts + 1;
    await user.save();
    throw new ApiError(
      400,
      "Incorrect verification code. Please try again.",
      [],
      "INVALID_VERIFICATION_CODE"
    );
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  clearVerificationCode(user);
  await user.save();

  return {
    token: signToken(user.id),
    user: user.toSafeObject(),
  };
};

export const resendVerificationEmail = async (email) => {
  if (!email) return { sent: false };

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || user.emailVerified === true) return { sent: false };

  if (user.emailVerificationSentAt) {
    const elapsed = Date.now() - new Date(user.emailVerificationSentAt).getTime();
    if (elapsed < 60_000) return { sent: false, retryAfter: 60 - Math.floor(elapsed / 1000) };
  }

  if (!isEmailConfigured()) return { sent: false, error: "not_configured" };

  return issueVerificationCode(user);
};
