import { Router } from "express";
import { searchUsers, searchPosts, searchAll } from "../controllers/search.controller.js";

const router = Router();

router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/all", searchAll);

export default router;
