import { Router } from "express";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../controllers/todos.controller.js";

const router = Router();

router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
