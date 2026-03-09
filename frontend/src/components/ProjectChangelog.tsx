import { useState, useEffect } from "react";
import api from "../api/axios";
import { formatRelativeDate } from "../utils/date";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

interface Changelog {
    id: string;
    content: string;
    created_at: string;
}

export default function ProjectChangelog({ projectId, isOwner }: { projectId: number | string, isOwner: boolean }) {
    const [logs, setLogs] = useState<Changelog[]>([]);
    const [loading, setLoading] = useState(true);
    const [newLog, setNewLog] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const { getToken } = useClerkAuth();

    useEffect(() => {
        fetchLogs();
    }, [projectId]);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/changelogs`);
            setLogs(res.data || []);
        } catch (err) {
            console.error("Failed to fetch changelogs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLog = async () => {
        if (!newLog.trim()) return;
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const res = await api.post(
                `/projects/${projectId}/changelogs`,
                { content: newLog },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLogs([res.data, ...logs]);
            setNewLog("");
            setShowAddForm(false);
        } catch (err) {
            console.error("Failed to add changelog:", err);
            alert("Failed to add changelog update.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ color: "#94a3b8", padding: "20px 0" }}>Loading updates...</div>;
    }

    return (
        <div style={{ marginTop: "10px" }}>
            {isOwner && (
                <div style={{ marginBottom: "24px" }}>
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 16px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#0f172a",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1" }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0" }}
                        >
                            <HugeiconsIcon icon={Add01Icon} size={18} />
                            Add Build Update
                        </button>
                    ) : (
                        <div style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "16px"
                        }}>
                            <textarea
                                value={newLog}
                                onChange={(e) => setNewLog(e.target.value)}
                                placeholder="What did you build today? Write your changelog here..."
                                style={{
                                    width: "100%",
                                    minHeight: "100px",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "15px",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                    marginBottom: "16px",
                                    boxSizing: "border-box",
                                    outline: "none"
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = "#0f172a"}
                                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                            />
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    style={{
                                        padding: "8px 16px",
                                        background: "transparent",
                                        border: "none",
                                        color: "#64748b",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: "14px"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddLog}
                                    disabled={isSubmitting || !newLog.trim()}
                                    style={{
                                        padding: "8px 20px",
                                        background: "#0f172a",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        cursor: (isSubmitting || !newLog.trim()) ? "not-allowed" : "pointer",
                                        opacity: (isSubmitting || !newLog.trim()) ? 0.7 : 1,
                                        fontSize: "14px"
                                    }}
                                >
                                    {isSubmitting ? "Posting..." : "Post Update"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {logs.length === 0 ? (
                <div style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "15px"
                }}>
                    No build updates yet.
                </div>
            ) : (
                <div style={{ position: "relative", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Vertical Timeline Line */}
                    <div style={{
                        position: "absolute",
                        top: "8px",
                        bottom: "0",
                        left: "6px",
                        width: "2px",
                        background: "#e2e8f0",
                        zIndex: 0
                    }} />

                    {logs.map((log) => (
                        <div key={log.id} style={{ position: "relative", zIndex: 1 }}>
                            {/* Timeline Dot */}
                            <div style={{
                                position: "absolute",
                                top: "6px",
                                left: "-24px",
                                width: "14px",
                                height: "14px",
                                background: "#0f172a",
                                borderRadius: "50%",
                                border: "3px solid #fff",
                                boxShadow: "0 0 0 1px #e2e8f0"
                            }} />

                            {/* Timestamp */}
                            <div style={{
                                fontSize: "13px",
                                color: "#64748b",
                                fontWeight: 600,
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "center"
                            }}>
                                {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                                <span style={{ fontWeight: 500 }}>{formatRelativeDate(log.created_at)}</span>
                            </div>

                            {/* Content Card */}
                            <div style={{
                                background: "#fff",
                                border: "1px solid #f1f5f9",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
                            }}>
                                <div style={{
                                    fontSize: "15px",
                                    lineHeight: "1.6",
                                    color: "#334155",
                                    whiteSpace: "pre-wrap"
                                }}>
                                    {log.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
