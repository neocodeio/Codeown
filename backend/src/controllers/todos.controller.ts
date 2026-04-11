import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function getTodos(req: Request, res: Response) {
    try {
        const userId = req.user?.sub || req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from("todos")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return res.json(data);
    } catch (err: any) {
        console.error("[getTodos] Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function createTodo(req: Request, res: Response) {
    try {
        const userId = req.user?.sub || req.user?.id;
        const { title } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!title) return res.status(400).json({ error: "Title is required" });

        const { data, error } = await supabase
            .from("todos")
            .insert({
                user_id: userId,
                title: title.trim(),
                completed: false
            })
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json(data);
    } catch (err: any) {
        console.error("[createTodo] Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateTodo(req: Request, res: Response) {
    try {
        const userId = req.user?.sub || req.user?.id;
        const { id } = req.params;
        const { completed, title } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from("todos")
            .update({
                ...(completed !== undefined && { completed }),
                ...(title !== undefined && { title: title.trim() })
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err: any) {
        console.error("[updateTodo] Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function deleteTodo(req: Request, res: Response) {
    try {
        const userId = req.user?.sub || req.user?.id;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { error } = await supabase
            .from("todos")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;
        return res.status(204).send();
    } catch (err: any) {
        console.error("[deleteTodo] Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
