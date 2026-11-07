import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

// Security + CORS
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body parsers
// Blog create/upload accepts base64 images (file picker + whiteboard canvas),
// so /api/blogs needs a larger limit. body-parser skips re-parsing once
// req._body is set, so mounting it BEFORE the global 10kb parser is safe.
app.use("/api/blogs", express.json({ limit: "8mb" }));
app.use("/api/auth", express.json({ limit: "8mb" }));
app.use("/api/users", express.json({ limit: "8mb" }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Root
app.get("/", (_req, res) => {
  res.json({ success: true, message: "FinBridge API running", version: "2.0" });
});

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
