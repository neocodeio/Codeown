import { useState, useEffect } from "react";
import api from "../api/axios";
import { formatRelativeDate } from "../utils/date";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Plus, X, ListPlus, Terminal } from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";

interface Changelog {
    id: string;
    content: string;
    created_at: string;
}

export default function ProjectChangelog({ projectId, isOwner }: { projectId: number | string, isOwner: boolean }) {
    const { width } = useWindowSize();
    const isMobile = width < 768;
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
        } catch (err: any) {
            console.error("Failed to add changelog:", err);
            const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || "Unknown error";
            alert(`Failed to add changelog update: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: "12px", textTransform: "uppercase" }}>
                <div style={{ width: "16px", height: "16px", border: "1px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "99px", animation: "spin 0.8s linear infinite" }} />
                FETCHING_LOGS...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "20px" }}>
            {isOwner && (
                <div style={{ marginBottom: "32px" }}>
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 16px",
                                backgroundColor: "var(--bg-input)",
                                border: "1px solid var(--border-hairline)",
                                borderRadius: "2px",
                                color: "var(--text-primary)",
                                fontWeight: 700,
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { 
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)"; 
                                e.currentTarget.style.borderColor = "var(--text-primary)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => { 
                                e.currentTarget.style.backgroundColor = "var(--bg-input)"; 
                                e.currentTarget.style.borderColor = "var(--border-hairline)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <Plus size={14} weight="bold" />
                            ADD_BUILD_UPDATE
                        </button>
                    ) : (
                        <div style={{
                            backgroundColor: "var(--bg-input)",
                            border: "1px solid var(--text-primary)",
                            borderRadius: "2px",
                            padding: "20px",
                            animation: "slideIn 0.3s ease-out"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--text-tertiary)", fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", fontWeight: 700 }}>
                                <Terminal size={14} weight="bold" />
                                SYSTEM_INPUT_ACTIVE
                            </div>
                            <textarea
                                value={newLog}
                                onChange={(e) => setNewLog(e.target.value)}
                                placeholder="What did you build today? Write your entry..."
                                style={{
                                    width: "100%",
                                    minHeight: "120px",
                                    padding: "14px",
                                    borderRadius: "2px",
                                    border: "1px solid var(--border-hairline)",
                                    backgroundColor: "var(--bg-page)",
                                    fontSize: "14px",
                                    color: "var(--text-primary)",
                                    resize: "vertical",
                                    fontFamily: "var(--font-main)",
                                    marginBottom: "16px",
                                    boxSizing: "border-box",
                                    outline: "none",
                                    transition: "all 0.15s ease"
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = "var(--text-primary)"}
                                onBlur={e => e.currentTarget.style.borderColor = "var(--border-hairline)"}
                            />
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 16px",
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-tertiary)",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
                                >
                                    <X size={14} weight="bold" />
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleAddLog}
                                    disabled={isSubmitting || !newLog.trim()}
                                    style={{
                                        padding: "8px 20px",
                                        background: "var(--text-primary)",
                                        color: "var(--bg-page)",
                                        border: "none",
                                        borderRadius: "2px",
                                        fontWeight: 800,
                                        cursor: (isSubmitting || !newLog.trim()) ? "not-allowed" : "pointer",
                                        opacity: (isSubmitting || !newLog.trim()) ? 0.5 : 1,
                                        fontSize: "11px",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase",
                                        transition: "all 0.15s ease"
                                    }}
                                    onMouseEnter={e => { if(!isSubmitting && newLog.trim()) e.currentTarget.style.opacity = "0.9" }}
                                    onMouseLeave={e => { if(!isSubmitting && newLog.trim()) e.currentTarget.style.opacity = "1" }}
                                >
                                    {isSubmitting ? "PROCESSING..." : "POST_UPDATE"}
                                </button>
                            </div>
                            <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                        </div>
                    )}
                </div>
            )}

            {logs.length === 0 ? (
                <div style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    background: "var(--bg-hover)",
                    borderRadius: "2px",
                    border: "1px dashed var(--border-hairline)",
                    color: "var(--text-tertiary)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <ListPlus size={32} weight="thin" />
                    <div>
                        <p style={{ fontWeight: 800, color: "var(--text-primary)", margin: 0, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            NO_LOGS_DETECTED
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                            Document your engineering progress and share build updates.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ position: "relative", paddingLeft: isMobile ? "20px" : "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
                    {/* Vertical Timeline Line */}
                    <div style={{
                        position: "absolute",
                        top: "8px",
                        bottom: "0",
                        left: "0px",
                        width: "1px",
                        background: "var(--border-hairline)",
                        zIndex: 0
                    }} />

                    {logs.map((log) => (
                        <div key={log.id} style={{ position: "relative", zIndex: 1 }}>
                            {/* Timeline Node */}
                            <div style={{
                                position: "absolute",
                                top: "0px",
                                left: isMobile ? "-23px" : "-35px",
                                width: "7px",
                                height: "7px",
                                background: "var(--bg-page)",
                                border: "1.5px solid var(--text-primary)",
                                borderRadius: "1px",
                            }} />

                            {/* Metadata */}
                            <div style={{
                                fontSize: "10px",
                                color: "var(--text-tertiary)",
                                fontWeight: 700,
                                marginBottom: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}>
                                <span style={{ color: "var(--text-primary)" }}>
                                    {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                                <span style={{ opacity: 0.3 }}>|</span>
                                <span>{formatRelativeDate(log.created_at)}</span>
                            </div>

                            {/* Content Entry */}
                            <div style={{
                                background: "var(--bg-page)",
                                border: "1px solid var(--border-hairline)",
                                borderRadius: "2px",
                                padding: "24px",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "var(--text-tertiary)";
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "var(--border-hairline)";
                                e.currentTarget.style.backgroundColor = "var(--bg-page)";
                            }}>
                                <div style={{
                                    fontSize: "15px",
                                    lineHeight: "1.7",
                                    color: "var(--text-secondary)",
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
