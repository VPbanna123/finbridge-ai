import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import schemeRoutes from "./scheme.routes.js";
import expenseRoutes from "./expense.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import healthRoutes from "./health.routes.js";
import surveyRoutes from "./survey.routes.js";
import blogRoutes from "./blog.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/schemes", schemeRoutes);
router.use("/expenses", expenseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/survey", surveyRoutes);
router.use("/blogs", blogRoutes);
router.use("/chat", chatRoutes);

export default router;
