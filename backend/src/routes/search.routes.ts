import { Router } from "express";
import { searchUsers, searchPosts, searchProjects, searchAll, searchDevelopers } from "../controllers/search.controller.js";

const router = Router();

router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/projects", searchProjects);
router.get("/developers", searchDevelopers);
router.get("/all", searchAll);

export default router;
