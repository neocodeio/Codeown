import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
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
            backdropFilter: "blur(4px)",
            padding: "20px"
        }}>
            <div
                ref={modalRef}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "24px",
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9"
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "24px",
                        fontWeight: 800,
                        color: "#1e293b",
                    }}>New message</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "50%",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <HugeiconsIcon icon={Cancel01Icon} style={{ fontSize: "20px" }} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: "16px 24px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: "#f8fafc",
                        padding: "10px 16px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.2s"
                    }}>
                        <HugeiconsIcon icon={Search01Icon} style={{ color: "#94a3b8", fontSize: "18px" }} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search people"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: "none",
                                background: "none",
                                flex: 1,
                                outline: "none",
                                fontSize: "15px",
                                color: "#1e293b"
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
                            <div style={{ width: "24px", height: "24px", border: "2px solid #eee", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        </div>
                    ) : searchQuery.length > 0 && users.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
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
                                    padding: "12px 16px",
                                    borderRadius: "16px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <img
                                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`}
                                    alt=""
                                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center" }}>
                                        {u.name}
                                        <VerifiedBadge username={u.username} size="14px" />
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "13px" }}>@{u.username}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
