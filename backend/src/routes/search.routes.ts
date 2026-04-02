import { Router } from "express";
import { searchUsers, searchPosts, searchProjects, searchAll, searchDevelopers, searchStartups } from "../controllers/search.controller.js";

const router = Router();

router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/projects", searchProjects);
router.get("/startups", searchStartups);
router.get("/developers", searchDevelopers);
router.get("/all", searchAll);

export default router;
