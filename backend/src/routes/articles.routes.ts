import { Router } from "express";
import {
  getArticles,
  getArticle,
  createArticle,
  toggleArticleLike,
  toggleArticleSave,
  getArticleComments,
  createArticleComment,
  deleteArticle,
  deleteArticleComment,
  toggleArticleCommentLike
} from "../controllers/articles.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/articles", optionalAuth, getArticles);
router.get("/articles/:id", optionalAuth, getArticle);
router.post("/articles", requireAuth, createArticle);
router.post("/articles/:id/like", requireAuth, toggleArticleLike);
router.post("/articles/:id/save", requireAuth, toggleArticleSave);
router.get("/articles/:id/comments", optionalAuth, getArticleComments);
router.post("/articles/:id/comments", requireAuth, createArticleComment);
router.delete("/articles/:id/comments/:commentId", requireAuth, deleteArticleComment);
router.post("/comments/:commentId/like", requireAuth, toggleArticleCommentLike);
router.delete("/articles/:id", requireAuth, deleteArticle);

export default router;
