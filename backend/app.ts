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

const app = express();

app.use(cors());

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

export default app;
