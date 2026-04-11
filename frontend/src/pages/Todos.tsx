import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { SEO } from "../components/SEO";
import { Plus, Trash, Check, Clock, Calendar } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

interface Todo {
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
}

export default function Todos() {
    const { user, isLoaded } = useClerkUser();
    const { getToken } = useClerkAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTodo, setNewTodo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTodos = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            const res = await api.get("/todos", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setTodos(res.data);
            } else {
                setTodos([]);
            }
        } catch (err) {
            console.error("Failed to fetch todos", err);
            setTodos([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user) {
            fetchTodos();
        }
    }, [isLoaded, user]);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const res = await api.post("/todos", { title: newTodo.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTodos([res.data, ...todos]);
            setNewTodo("");
            toast.success("Focus item registered");
        } catch (err: any) {
            console.error("Add Todo Error:", err);
            const msg = err.response?.data?.error || "Network sync failed";
            toast.error(msg === "Unauthorized" ? "Please sign in again" : msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTodo = async (todo: Todo) => {
        const originalTodos = [...todos];
        setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));

        try {
            const token = await getToken();
            await api.patch(`/todos/${todo.id}`, { completed: !todo.completed }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            setTodos(originalTodos);
            toast.error("Sync error");
        }
    };

    const deleteTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const originalTodos = [...todos];
        setTodos(todos.filter(t => t.id !== id));

        try {
            const token = await getToken();
            await api.delete(`/todos/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            setTodos(originalTodos);
            toast.error("Deletion failed");
        }
    };

    const completedCount = Array.isArray(todos) ? todos.filter(t => t.completed).length : 0;
    const progress = (Array.isArray(todos) && todos.length > 0) ? (completedCount / todos.length) * 100 : 0;

    return (
        <main className="todos-container" style={{
            minHeight: "100vh",
            backgroundColor: "var(--bg-page)",
            padding: "80px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
            <SEO title="Focus" description="The technical milestone console." />
            <ToastContainer position="bottom-right" theme="dark" hideProgressBar />

            <div style={{ maxWidth: "600px", width: "100%" }}>
                {/* Raycast Style Header */}
                <header style={{ marginBottom: "56px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ 
                            fontSize: "36px", 
                            fontWeight: 800, 
                            color: "var(--text-primary)", 
                            margin: 0, 
                            letterSpacing: "-0.04em",
                            lineHeight: 1
                        }}>
                            Focus
                        </h1>
                        <div style={{ 
                            marginTop: "12px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            fontSize: "13px",
                            color: "var(--text-tertiary)",
                            fontWeight: 600
                        }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Clock size={16} /> Technical Session
                            </span>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border-hairline)" }} />
                            <span>{todos.length} Active Items</span>
                        </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            padding: "6px 12px", 
                            borderRadius: "100px", 
                            backgroundColor: "var(--bg-hover)",
                            border: "1px solid var(--border-hairline)"
                        }}>
                           <div style={{ width: "32px", height: "4px", backgroundColor: "var(--border-light)", borderRadius: "2px", overflow: "hidden" }}>
                               <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    style={{ height: "100%", backgroundColor: "var(--text-primary)" }}
                               />
                           </div>
                           <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)" }}>{Math.round(progress)}%</span>
                        </div>
                    </div>
                </header>

                {/* Control Bar (Input) */}
                <div style={{ position: "sticky", top: "24px", zIndex: 10, marginBottom: "40px" }}>
                    <form onSubmit={handleAddTodo} style={{ 
                        backgroundColor: "var(--bg-page)",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "16px",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 12px 24px -10px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.04)"
                    }}>
                        <div style={{ paddingLeft: "16px", color: "var(--text-tertiary)" }}>
                            <Plus size={20} weight="bold" />
                        </div>
                        <input 
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="Register a new milestone..."
                            style={{
                                flex: 1,
                                height: "48px",
                                background: "none",
                                border: "none",
                                outline: "none",
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                fontWeight: 500,
                            }}
                        />
                        <button 
                            type="submit"
                            disabled={!newTodo.trim()}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "12px",
                                backgroundColor: newTodo.trim() ? "var(--text-primary)" : "transparent",
                                color: newTodo.trim() ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "none",
                                fontWeight: 700,
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            Commit
                        </button>
                    </form>
                </div>

                {/* Console Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border-hairline)", border: "1px solid var(--border-hairline)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    {isLoading ? (
                        <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--bg-page)", color: "var(--text-tertiary)", fontSize: "14px" }}>Synchronizing...</div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {!Array.isArray(todos) || todos.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ padding: "100px 40px", textAlign: "center", backgroundColor: "var(--bg-page)" }}
                                >
                                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", border: "1px dashed var(--border-hairline)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "var(--text-tertiary)" }}>
                                        <Calendar size={24} weight="light" />
                                    </div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Clear Horizon</h3>
                                    <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>The milestone console is ready for input.</p>
                                </motion.div>
                            ) : (
                                todos.map((todo) => (
                                    <motion.div
                                        key={todo.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => toggleTodo(todo)}
                                        style={{
                                            padding: "16px 20px",
                                            backgroundColor: "var(--bg-page)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            cursor: "pointer",
                                            transition: "background-color 0.15s ease",
                                            position: "relative"
                                        }}
                                        className="todo-row"
                                    >
                                        <div style={{ 
                                            width: "20px", 
                                            height: "20px", 
                                            borderRadius: "6px", 
                                            border: `1.5px solid ${todo.completed ? "var(--text-primary)" : "var(--border-light)"}`,
                                            backgroundColor: todo.completed ? "var(--text-primary)" : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--bg-page)",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                        }}>
                                            {todo.completed && <Check size={12} weight="bold" />}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                                fontSize: "15px", 
                                                fontWeight: 600, 
                                                color: todo.completed ? "var(--text-tertiary)" : "var(--text-primary)",
                                                textDecoration: todo.completed ? "line-through grayscale(100%)" : "none",
                                                transition: "all 0.2s ease"
                                            }}>
                                                {todo.title}
                                            </div>
                                            <div style={{ 
                                                fontSize: "11px", 
                                                color: "var(--text-tertiary)", 
                                                marginTop: "2px", 
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                opacity: 0.8
                                            }}>
                                                {formatDistanceToNow(new Date(todo.created_at), { addSuffix: true })}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={(e) => deleteTodo(todo.id, e)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "8px",
                                                color: "var(--text-tertiary)",
                                                borderRadius: "8px",
                                                opacity: 0,
                                                transition: "all 0.2s ease"
                                            }}
                                            className="todo-delete-trigger"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <style>{`
                .todo-row:hover {
                    background-color: var(--bg-hover) !important;
                }
                .todo-row:hover .todo-delete-trigger {
                    opacity: 0.6;
                }
                .todo-delete-trigger:hover {
                    opacity: 1 !important;
                    background-color: rgba(239, 68, 68, 0.1) !important;
                    color: #ef4444 !important;
                }
            `}</style>
        </main>
    );
}
