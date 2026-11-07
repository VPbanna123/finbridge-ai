import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
} from "../services/auth.service.js";
import { HTTP_STATUS } from "../utils/constants.js";

export const register = async (req, res) => {
  const result = await registerUser(req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: result.requiresVerification
      ? "Registration successful. Please check your email for your verification code."
      : "Registration successful",
    token: result.token,
    user: result.user,
    requiresVerification: result.requiresVerification,
    emailSent: result.emailSent,
  });
};

export const login = async (req, res) => {
  const result = await loginUser(req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Login successful",
    token: result.token,
    user: result.user,
  });
};

export const me = async (req, res) => {
  // req.user populated by auth middleware
  res.status(HTTP_STATUS.OK).json({
    success: true,
    user: req.user,
  });
};

export const verifyEmailAddress = async (req, res) => {
  const result = await verifyEmail(req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Email verified successfully",
    token: result.token,
    user: result.user,
  });
};

export const resendVerification = async (req, res) => {
  await resendVerificationEmail(req.body?.email);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message:
      "If an unverified account exists for this email, a new verification code has been sent.",
  });
};
