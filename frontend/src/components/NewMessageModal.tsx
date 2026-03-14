import { useState, useEffect, useRef } from "react";
import { MagnifyingGlass, X } from "phosphor-react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import VerifiedBadge from "./VerifiedBadge";

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

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px"
        }}>
            <div
                ref={modalRef}
                style={{
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                    overflow: "hidden"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "24px 32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "0.5px solid var(--border-hairline)"
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em"
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
                            borderRadius: "2px",
                            transition: "all 0.1s"
                        }}
                        className="btn-modal-close"
                    >
                        <X size={18} weight="thin" />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: "24px 32px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: "var(--bg-input)",
                        padding: "12px 16px",
                        borderRadius: "2px",
                        border: "0.5px solid var(--border-hairline)",
                    }}>
                        <MagnifyingGlass size={18} weight="thin" style={{ color: "var(--text-tertiary)" }} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="SEARCH PEOPLE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: "none",
                                background: "none",
                                flex: 1,
                                outline: "none",
                                fontSize: "12px",
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                        />
                    </div>
                </div>

                {/* User List */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0 12px 24px 12px"
                }}>
                    {loading ? (
                        <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
                            <div style={{ width: "24px", height: "24px", border: "1px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        </div>
                    ) : searchQuery.length > 0 && users.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                            No users found for "{searchQuery}"
                        </div>
                    ) : (
                        users.map(u => (
                            <div
                                key={u.id}
                                onClick={() => onSelectUser(u)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    padding: "12px 20px",
                                    borderRadius: "2px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    border: "0.5px solid transparent",
                                    marginBottom: "4px"
                                }}
                                className="user-select-row"
                            >
                                <img
                                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=212121&color=fff`}
                                    alt=""
                                    style={{ width: "40px", height: "40px", borderRadius: "2px", objectFit: "cover", border: "0.5px solid var(--border-hairline)" }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        {u.name}
                                        <VerifiedBadge username={u.username} size="14px" />
                                    </div>
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", fontWeight: 700 }}>@{u.username}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .btn-modal-close:hover { background-color: var(--bg-hover); }
                .user-select-row:hover { background-color: var(--bg-hover); border-color: var(--border-hairline); }
            `}</style>
        </div>
    );
}
