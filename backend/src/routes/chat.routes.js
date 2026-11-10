import { Router } from "express";
import {
  sendMessage,
  getHistory,
  listSessions,
  chatStatus,
} from "../controllers/chat.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// All chat routes require authentication
router.use(auth);

router.post("/send", asyncHandler(sendMessage));
router.get("/history", asyncHandler(getHistory));
router.get("/sessions", asyncHandler(listSessions));
router.get("/status", asyncHandler(chatStatus));

export default router;
