import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlass, X } from "phosphor-react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";

interface User {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
}

interface NewMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

export default function NewMessageModal({ isOpen, onClose, onSelectUser }: NewMessageModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const { getToken } = useClerkAuth();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchQuery.length < 1) {
                setUsers([]);
                return;
            }
            try {
                setLoading(true);
                const token = await getToken();
                const res = await api.get(`/search/users?q=${encodeURIComponent(searchQuery)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data || []);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: "20px",
                backdropFilter: "blur(8px)",
                animation: "modalFadeIn 0.2s ease"
            }}
        >
            <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-hairline)",
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    overflow: "hidden",
                    animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "24px 32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-hairline)"
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                    }}>New message</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "var(--text-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "var(--radius-xs)",
                            transition: "all 0.1s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: isMobile ? "16px 20px" : "20px 32px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-input)" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: "var(--bg-page)",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-hairline)",
                    }}>
                        <MagnifyingGlass size={18} weight="bold" style={{ color: "var(--text-tertiary)" }} />
                        <input
                            autoFocus
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: "none",
                                background: "none",
                                flex: 1,
                                outline: "none",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                padding: 0,
                                margin: 0,
                                width: "100%"
                            }}
                        />
                    </div>
                </div>

                {/* User List */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "8px"
                }}>
                    {loading ? (
                        <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
                            <div style={{ width: "24px", height: "24px", border: "1.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        </div>
                    ) : searchQuery.length > 0 && users.length === 0 ? (
                        <div style={{ padding: "60px 40px", textAlign: "center" }}>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>No users found</p>
                            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-tertiary)" }}>Try searching for someone else</p>
                        </div>
                    ) : (
                        users.map(u => (
                            <div
                                key={u.id}
                                onClick={() => {
                                    onSelectUser(u);
                                    onClose();
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <AvailabilityBadge avatarUrl={u.avatar_url} name={u.name} size={42} username={u.username} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        {u.name}
                                        <VerifiedBadge username={u.username} size="14px" />
                                    </div>
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>@{u.username}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
}
