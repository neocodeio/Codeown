import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import postsRoutes from "./src/routes/posts.routes.js";
import commentsRoutes from "./src/routes/comments.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import webhooksRoutes from "./src/routes/webhooks.routes.js";
import likesRoutes from "./src/routes/likes.routes.js";
import followsRoutes from "./src/routes/follows.routes.js";
import searchRoutes from "./src/routes/search.routes.js";
import savedRoutes from "./src/routes/saved.routes.js";
import notificationsRoutes from "./src/routes/notifications.routes.js";
import feedbackRoutes from "./src/routes/feedback.routes.js";
import projectsRoutes from "./src/routes/projects.routes.js";
import projectCommentsRoutes from "./src/routes/projectComments.routes.js";
import messagesRoutes from "./src/routes/messages.routes.js";
import migrationRoutes from "./src/routes/migration.routes.js";
import imageProxyRoutes from "./src/routes/image-proxy.routes.js";
import metadataRoutes from "./src/routes/metadata.routes.js";
import seoRoutes from "./src/routes/seo.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import leaderboardRoutes from "./src/routes/leaderboard.routes.js";
import changelogsRoutes from "./src/routes/changelogs.routes.js";
import startupsRoutes from "./src/routes/startups.routes.js";
import { handleDodoWebhook, handleClerkWebhook } from "./src/controllers/webhooks.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import helmet from "helmet";

import rateLimit from "express-rate-limit";

const app = express();

// Trust proxy for Railway/deployment load balancers
app.set("trust proxy", 1);

// 1. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://codeown.space",
  "https://www.codeown.space"
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.toLowerCase();
    const isAllowed = allowedOrigins.some(o => o.toLowerCase() === normalizedOrigin) ||
      /^https?:\/\/([a-z0-9-]+\.)?codeown\.space$/i.test(normalizedOrigin) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(normalizedOrigin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Clerk-User-Id",
    "X-Clerk-Auth-Token",
    "X-Clerk-After-Sign-In-Url",
    "X-Clerk-After-Sign-Up-Url"
  ],
  optionsSuccessStatus: 204,
  maxAge: 86400
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Explicitly handle all preflight requests
app.options(/.*/, cors(corsOptions) as any);

// 2. Security Headers (Moved after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// 3. Webhooks need raw body for signature verification
app.post("/webhooks/dodo", express.raw({ type: "*/*" }), handleDodoWebhook);
app.post("/webhooks/clerk", express.raw({ type: "*/*" }), handleClerkWebhook);

// 4. Regular JSON parser
app.use(express.json({ limit: "50mb" }));

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Very high limit to ensure no blocking during development/testing
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/users", usersRoutes);
app.use("/upload", uploadRoutes);
app.use("/likes", likesRoutes);
app.use("/follows", followsRoutes);
app.use("/search", searchRoutes);
app.use("/saved", savedRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/projects", projectsRoutes);
app.use("/messages", messagesRoutes);
app.use("/", projectCommentsRoutes);
app.use("/migration", migrationRoutes);
app.use("/image-proxy", imageProxyRoutes);
app.use("/metadata", metadataRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/changelogs", changelogsRoutes);
app.use("/startups", startupsRoutes);

// Static assets should be served first (except index.html)
app.use(express.static(path.join(__dirname, "../frontend/dist"), { index: false }));

app.use("/", seoRoutes);

export default app;
// Force backend reload
