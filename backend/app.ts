import express from "express";
import cors from "cors";
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

import helmet from "helmet";

import rateLimit from "express-rate-limit";

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean) as string[],
  credentials: true
}));

// Webhooks need raw body for signature verification - must be before express.json()
app.use("/webhooks", express.raw({ type: "application/json" }), webhooksRoutes);

// Regular routes use JSON
app.use(express.json({ limit: "50mb" })); // Increase limit for image uploads
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

export default app;
