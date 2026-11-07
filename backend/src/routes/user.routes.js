import { Router } from "express";
import { body } from "express-validator";
import { patchProfile, patchProfileImage } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// All user routes are protected
router.use(auth);

router.patch("/profile", asyncHandler(patchProfile));
router.patch(
  "/profile/photo",
  [
    body("image").isString().notEmpty().withMessage("Profile image is required"),
    validate,
  ],
  asyncHandler(patchProfileImage)
);

export default router;
