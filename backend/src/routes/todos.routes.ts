import { Router } from "express";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../controllers/todos.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
