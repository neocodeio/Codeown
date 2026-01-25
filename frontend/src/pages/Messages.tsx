import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useWindowSize } from "../hooks/useWindowSize";
import { faPaperPlane, faCommentSlash, faChevronLeft } from "@fortawesome/free-solid-svg-icons";

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

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
            <div style={{ width: "30px", height: "30px", border: "3px solid #eee", borderTopColor: "#000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
    );

    return (
        <main className="container" style={{
            padding: isMobile ? "10px" : "40px 20px",
            height: isMobile ? "calc(100vh - 70px)" : "calc(100vh - 80px)",
            display: "flex",
            gap: isMobile ? "0" : "20px"
        }}>
            {/* Sidebar - Hidden on mobile if a conversation is active */}
            {(!isMobile || !activeConvo) && (
                <div style={{
                    width: isMobile ? "100%" : isTablet ? "300px" : "350px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: isMobile ? "25px" : "25px",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e0e0e0",
                    overflow: "hidden"
                }}>
                    <div style={{ padding: "20px", borderBottom: "1px solid #e0e0e0"}}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Messages</h2>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {conversations.length === 0 && !targetUserId && (
                            <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
                                <FontAwesomeIcon icon={faCommentSlash} style={{ fontSize: "30px", marginBottom: "10px", opacity: 0.3 }} />
                                <p>No conversations yet.</p>
                            </div>
                        )}
                        {conversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => setActiveConvo(convo)}
                                style={{
                                    padding: "15px 20px",
                                    cursor: "pointer",
                                    backgroundColor: activeConvo?.id === convo.id ? "#fff" : "transparent",
                                    borderBottom: "1px solid #eee",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    transition: "background-color 0.2s"
                                }}
                            >
                                <img
                                    src={convo.partner.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.partner.name)}&background=000&color=fff`}
                                    alt=""
                                    style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{convo.partner.name}</div>
                                    <div style={{
                                        fontSize: "13px",
                                        color: "#666",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {convo.last_message?.content || "No messages yet"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Area - On mobile, only show if activeConvo exists */}
            {(!isMobile || activeConvo) && (
                <div style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: isMobile ? "25px" : "25px",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e0e0e0",
                    overflow: "hidden"
                }}>
                    {activeConvo ? (
                        <>
                            {/* Header */}
                            <div style={{
                                padding: "15px 20px",
                                borderBottom: "1px solid #eee",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                backgroundColor: "#f9f9f9"
                            }}>
                                {isMobile && (
                                    <button
                                        onClick={() => setActiveConvo(null)}
                                        style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer' }}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                )}
                                <img
                                    src={activeConvo.partner.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConvo.partner.name)}&background=000&color=fff`}
                                    alt=""
                                    style={{ width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer" }}
                                    onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                                />
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{ fontWeight: 800, cursor: "pointer", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                                    >
                                        {activeConvo.partner.name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#666", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{activeConvo.partner.username}</div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "15px" : "25px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {messages.length === 0 && activeConvo.id !== 0 && (
                                    <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>Say hello!</div>
                                )}
                                {messages.map((msg, idx) => {
                                    const isMine = msg.sender_id === currentUser?.id;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            style={{
                                                alignSelf: isMine ? "flex-end" : "flex-start",
                                                maxWidth: isMobile ? "85%" : "70%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: isMine ? "flex-end" : "flex-start",
                                                gap: "4px"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "10px 16px",
                                                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                    backgroundColor: isMine ? "#849bff" : "#f1f1f1",
                                                    color: isMine ? "#fff" : "#000",
                                                    fontSize: "14px",
                                                    lineHeight: "1.4",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                            <span style={{
                                                fontSize: "9px",
                                                color: "var(--text-tertiary)",
                                                fontWeight: 600,
                                                padding: "0 4px"
                                            }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={handleSendMessage}
                                style={{ padding: isMobile ? "15px" : "20px 25px", borderTop: "1px solid #eee", display: "flex", gap: "12px", backgroundColor: '#fff' }}
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
                                        padding: "10px 18px",
                                        borderRadius: "25px",
                                        border: "1px solid #ddd",
                                        outline: "none",
                                        backgroundColor: "#f9f9f9",
                                        fontSize: "14px"
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        border: "none",
                                        backgroundColor: newMessage.trim() ? "#000" : "#ccc",
                                        color: "#fff",
                                        cursor: newMessage.trim() ? "pointer" : "default",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background-color 0.2s"
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", flexDirection: "column", gap: "10px" }}>
                            <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "40px", opacity: 0.1 }} />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
