import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SentIcon,
    Comment01Icon,
    ArrowLeft01Icon,
    MailEdit01Icon,
    Search01Icon,
} from "@hugeicons/core-free-icons";
import NewMessageModal from "../components/NewMessageModal";
import VerifiedBadge from "../components/VerifiedBadge";

interface Partner {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
}

interface Message {
    id: number;
    conversation_id: number;
    sender_id: string;
    content: string;
    created_at: string;
}

interface Conversation {
    id: number;
    partner: Partner;
    last_message: Message | null;
}

export default function Messages() {
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get("userId");
    const { getToken } = useClerkAuth();
    const { user: currentUser } = useClerkUser();
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const res = await api.get("/messages", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const convos = Array.isArray(res.data) ? res.data : [];
            setConversations(convos);

            // If we have a targetUserId, find or start that convo
            if (targetUserId) {
                const existing = convos.find((c: Conversation) => c.partner.id === targetUserId);
                if (existing) {
                    setActiveConvo(existing);
                } else {
                    await startPlaceholderConvo(targetUserId);
                }
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            // Even if fetch fails, try to show placeholder if userId is present
            if (targetUserId) {
                await startPlaceholderConvo(targetUserId);
            }
        } finally {
            setLoading(false);
        }
    };

    const startPlaceholderConvo = async (userId: string) => {
        try {
            const token = await getToken();
            const res = await api.get(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                const placeholder: Conversation = {
                    id: 0, // indicates it doesn't exist yet
                    partner: {
                        id: res.data.id,
                        name: res.data.name,
                        username: res.data.username,
                        avatar_url: res.data.avatar_url
                    },
                    last_message: null
                };
                setActiveConvo(placeholder);
                setIsNewMessageModalOpen(false); // Close modal if open
            }
        } catch (error) {
            console.error("Error starting placeholder convo:", error);
        }
    };

    const fetchMessages = async (convoId: number) => {
        if (convoId === 0) {
            setMessages([]);
            return;
        }
        try {
            const token = await getToken();
            const res = await api.get(`/messages/${convoId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [targetUserId]);

    useEffect(() => {
        if (activeConvo && activeConvo.id !== 0) {
            fetchMessages(activeConvo.id);

            // Basic polling for new messages
            const interval = setInterval(() => {
                fetchMessages(activeConvo.id);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeConvo?.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const token = await getToken();
            const res = await api.post("/messages", {
                conversationId: activeConvo?.id === 0 ? undefined : activeConvo?.id,
                recipientId: activeConvo?.id === 0 ? activeConvo?.partner.id : undefined,
                content: newMessage.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNewMessage("");
            if (activeConvo?.id === 0) {
                // We just started a new convo
                // Refresh everything
                await fetchConversations();
            } else {
                setMessages([...messages, res.data]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(convo =>
        convo.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (convo.partner.username && convo.partner.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
            <div style={{ width: "30px", height: "30px", border: "3px solid #eee", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
    );

    return (
        <main className="container" style={{
            padding: isMobile ? "0" : "24px",
            height: isMobile ? "calc(100vh - 66px)" : "calc(100vh - 80px)", // Adjusted for mobile nav
            display: "flex",
            gap: "24px",
            maxWidth: "1280px",
            margin: "0 auto",
            boxSizing: "border-box",
            overflow: "hidden" // Prevent outer scroll
        }}>
            {/* Sidebar - List of Conversations */}
            {(!isMobile || !activeConvo) && (
                <div style={{
                    width: isMobile ? "100%" : isTablet ? "300px" : "360px",
                    backgroundColor: "#fff",
                    borderRadius: isMobile ? "0" : "24px",
                    display: "flex",
                    flexDirection: "column",
                    border: isMobile ? "none" : "1px solid #e2e8f0",
                    boxShadow: isMobile ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    height: "100%"
                }}>
                    <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Messages</h2>
                            <button
                                onClick={() => setIsNewMessageModalOpen(true)}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: "#fff",
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#fff";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                <HugeiconsIcon icon={MailEdit01Icon} style={{ fontSize: "20px" }} />
                            </button>
                        </div>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 16px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s"
                        }}>
                            <HugeiconsIcon icon={Search01Icon} style={{ color: "#94a3b8", fontSize: "16px" }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: "none",
                                    background: "none",
                                    flex: 1,
                                    outline: "none",
                                    fontSize: "14px",
                                    color: "#1e293b"
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                        {conversations.length === 0 && !targetUserId && (
                            <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                                <HugeiconsIcon icon={MailEdit01Icon} style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }} />
                                <p style={{ fontWeight: 500, margin: 0 }}>No conversations yet</p>
                                <p style={{ fontSize: "14px", marginTop: "8px" }}>Start connecting with people!</p>
                            </div>
                        )}
                        {filteredConversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => setActiveConvo(convo)}
                                style={{
                                    padding: "16px",
                                    cursor: "pointer",
                                    backgroundColor: activeConvo?.id === convo.id ? "#f0f0f0" : "transparent",
                                    borderRadius: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    marginBottom: "4px",
                                    border: activeConvo?.id === convo.id ? "1px solid #e2e8f0" : "1px solid transparent",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    if (activeConvo?.id !== convo.id) e.currentTarget.style.backgroundColor = "#f8fafc";
                                }}
                                onMouseLeave={(e) => {
                                    if (activeConvo?.id !== convo.id) e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={convo.partner.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.partner.name)}&background=random&color=fff`}
                                        alt=""
                                        style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                                    />
                                    {/* Online indicator could go here if we had that data */}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                                        <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center" }}>
                                            {convo.partner.name}
                                            <VerifiedBadge username={convo.partner.username} size="14px" />
                                        </div>
                                        {convo.last_message && (
                                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                {new Date(convo.last_message.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                                    ? new Date(convo.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : new Date(convo.last_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: "13px",
                                        color: activeConvo?.id === convo.id ? "#212121" : "#64748b",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        fontWeight: activeConvo?.id === convo.id ? 600 : 400
                                    }}>
                                        {convo.last_message?.content || "No messages yet"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            {(!isMobile || activeConvo) && (
                <div style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: isMobile ? "0" : "24px",
                    display: "flex",
                    flexDirection: "column",
                    border: isMobile ? "none" : "1px solid #e2e8f0",
                    boxShadow: isMobile ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    height: "100%",
                    position: "relative" // For absolute positioning if needed
                }}>
                    {activeConvo ? (
                        <>
                            {/* Header */}
                            <div style={{
                                padding: isMobile ? "12px 16px" : "16px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                backdropFilter: "blur(8px)",
                                zIndex: 10,
                                flexShrink: 0
                            }}>
                                {isMobile && (
                                    <button
                                        onClick={() => setActiveConvo(null)}
                                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', marginLeft: "-8px", color: "#64748b", display: "flex", alignItems: "center" }}
                                    >
                                        <HugeiconsIcon icon={ArrowLeft01Icon} style={{ fontSize: "24px" }} />
                                    </button>
                                )}
                                <img
                                    src={activeConvo.partner.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConvo.partner.name)}&background=random&color=fff`}
                                    alt=""
                                    style={{ width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
                                    onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                                />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                        style={{ fontWeight: 700, cursor: "pointer", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center" }}
                                        onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                                    >
                                        {activeConvo.partner.name}
                                        <VerifiedBadge username={activeConvo.partner.username} size="14px" />
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>@{activeConvo.partner.username}</div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: isMobile ? "16px" : "24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                                backgroundColor: isMobile ? "#fff" : "#fafafa"
                            }}>
                                {messages.length === 0 && activeConvo.id !== 0 && (
                                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                            <HugeiconsIcon icon={Comment01Icon} style={{ fontSize: "32px", opacity: 0.5 }} />
                                        </div>
                                        <p style={{ fontWeight: 600, color: "#475569" }}>No messages yet</p>
                                        <p style={{ fontSize: "14px" }}>Start the conversation by sending a message below.</p>
                                    </div>
                                )}
                                {messages.map((msg, idx) => {
                                    const isMine = msg.sender_id === currentUser?.id;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            style={{
                                                alignSelf: isMine ? "flex-end" : "flex-start",
                                                maxWidth: isMobile ? "85%" : "65%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: isMine ? "flex-end" : "flex-start",
                                                gap: "4px"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "12px 18px",
                                                    borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                                                    backgroundColor: isMine ? "#212121" : "#fff",
                                                    color: isMine ? "#fff" : "#1e293b",
                                                    fontSize: "15px",
                                                    lineHeight: "1.5",
                                                    boxShadow: isMine ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "0 2px 4px rgba(0,0,0,0.05)",
                                                    border: isMine ? "none" : "1px solid #e2e8f0",
                                                    wordWrap: "break-word"
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                            <span style={{
                                                fontSize: "10px",
                                                color: "#94a3b8",
                                                fontWeight: 500,
                                                padding: "0 6px"
                                            }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={{
                                padding: isMobile ? "12px 16px" : "16px 24px",
                                backgroundColor: "#fff",
                                borderTop: "1px solid #f1f5f9",
                                flexShrink: 0,
                                position: "sticky",
                                bottom: 0
                            }}>
                                <form
                                    onSubmit={handleSendMessage}
                                    style={{ display: "flex", gap: "12px", alignItems: "center" }}
                                >
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e as any);
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        style={{
                                            flex: 1,
                                            padding: isMobile ? "12px 16px" : "14px 20px",
                                            borderRadius: "99px",
                                            border: "1px solid #e2e8f0",
                                            outline: "none",
                                            backgroundColor: "#f8fafc",
                                            fontSize: "15px",
                                            color: "#1e293b",
                                            transition: "all 0.2s",
                                            minWidth: 0 // Prevent overflow
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#94a3b8"}
                                        onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        style={{
                                            width: isMobile ? "44px" : "48px",
                                            height: isMobile ? "44px" : "48px",
                                            borderRadius: "50%",
                                            border: "none",
                                            backgroundColor: newMessage.trim() ? "#212121" : "#f1f5f9",
                                            color: newMessage.trim() ? "#fff" : "#94a3b8",
                                            cursor: newMessage.trim() ? "pointer" : "default",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s",
                                            flexShrink: 0
                                        }}
                                    >
                                        <HugeiconsIcon icon={SentIcon} style={{ fontSize: isMobile ? "18px" : "20px" }} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexDirection: "column", gap: "16px", backgroundColor: isMobile ? "#fff" : "#fafafa", padding: "20px", textAlign: "center" }}>
                            <div style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <HugeiconsIcon icon={Comment01Icon} style={{ fontSize: "40px", color: "#212121" }} />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Your Messages</h3>
                            <p style={{ margin: 0, maxWidth: "300px", lineHeight: "1.5" }}>
                                Select a conversation from the sidebar to start chatting with your network.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <NewMessageModal
                isOpen={isNewMessageModalOpen}
                onClose={() => setIsNewMessageModalOpen(false)}
                onSelectUser={(user) => startPlaceholderConvo(user.id)}
            />
        </main>
    );
}
