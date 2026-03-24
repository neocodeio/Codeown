import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import {
  PaperPlaneTilt,
  CaretLeft,
  ChatTeardropText,
  NotePencil,
  MagnifyingGlass,
  Image as ImageIcon,
  X,
  ArrowClockwise,
  Trash,
  DotsThree,
  Microphone,
  StopCircle,
  Gif
} from "phosphor-react";
import NewMessageModal from "../components/NewMessageModal";
import GifPicker from "../components/GifPicker";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { socket } from "../lib/socket";

interface Partner {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  is_og?: boolean;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  image_url?: string;
  audio_url?: string;
  reply_to?: {
    id: number;
    content: string;
    sender_id: string;
    image_url?: string;
    audio_url?: string;
  };
  reactions?: { [emoji: string]: string[] };
  shared_post_id?: number;
  shared_project_id?: number;
  shared_post?: {
    id: number;
    title: string;
    content: string;
    images: string[];
    user: {
      name: string;
      username: string;
      avatar_url: string;
    };
  };
  shared_project?: {
    id: number;
    title: string;
    description: string;
    cover_image: string;
    user: {
      name: string;
      username: string;
      avatar_url: string;
    };
  };
}

interface Conversation {
  id: number;
  partner: Partner;
  last_message: Message | null;
  unread_count?: number;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const initialMessage = searchParams.get("message");
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
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [reactingTo, setReactingTo] = useState<number | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [initialMessage]);

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [messageMenuId, setMessageMenuId] = useState<number | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // If the user is within 150px of the bottom, consider them "at bottom"
      const atBottom = scrollHeight - scrollTop - clientHeight < 150;
      setIsAtBottom(atBottom);
    }
  };

  const scrollToBottom = (force = false) => {
    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  };

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPreviewImage(null);
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [previewImage]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const handleTyping = ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      scrollToBottom();
    };

    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
    };

    const handleMessagesRead = ({ conversationId, readerId }: { conversationId: number, readerId: string }) => {
      setMessages((prev) => prev.map(m => (m.conversation_id === conversationId && !m.is_read && m.sender_id !== readerId) ? { ...m, is_read: true } : m));
    };

    const handleMessageDeleted = ({ messageId, conversationId: _conversationId }: { messageId: number, conversationId: number }) => {
      setMessages((prev) => prev.filter(m => m.id !== Number(messageId)));
    };

    const handleNewMessage = (payload: any) => {
      // 1. Update messages list if this is the active conversation
      if (activeConvo && (activeConvo.id === payload.conversation_id || (activeConvo.id === 0 && activeConvo.partner.id === payload.sender_id))) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === payload.id);
          if (exists) return prev;
          return [...prev, payload];
        });
        scrollToBottom(true);
        // Mark as read via socket
        socket.emit("mark_read", {
          senderId: currentUser.id,
          receiverId: payload.sender_id,
          conversationId: payload.conversation_id
        });
      }

      // 2. Update conversations list (snippet, order, unread count)
      setConversations((prev) => {
        const convoIndex = prev.findIndex(c => c.id === payload.conversation_id || (c.id === 0 && c.partner.id === payload.sender_id));
        if (convoIndex === -1) {
          fetchConversations(false);
          return prev;
        }

        const updatedConvos = [...prev];
        const convo = updatedConvos[convoIndex];

        updatedConvos[convoIndex] = {
          ...convo,
          id: payload.conversation_id, // ensure ID is correct if it was a placeholder
          last_message: payload,
          unread_count: (activeConvo && (activeConvo.id === payload.conversation_id || (activeConvo.id === 0 && activeConvo.partner.id === payload.sender_id)))
            ? 0
            : (convo.unread_count || 0) + 1
        };

        // Move to top
        const [moved] = updatedConvos.splice(convoIndex, 1);
        return [moved, ...updatedConvos];
      });
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("new_message", handleNewMessage);
    };
  }, [currentUser?.id, activeConvo?.id]);

  useEffect(() => {
    if (reactingTo !== null || messageMenuId !== null) {
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        const picker = document.querySelector(".emoji-picker-overlay");
        const menu = document.querySelector(".message-action-menu");
        if ((picker && !picker.contains(e.target as Node)) && (menu && !menu.contains(e.target as Node))) {
          setReactingTo(null);
          setMessageMenuId(null);
        } else if (picker && !picker.contains(e.target as Node)) {
          setReactingTo(null);
        } else if (menu && !menu.contains(e.target as Node)) {
          setMessageMenuId(null);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
      };
    }
  }, [reactingTo, messageMenuId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const token = await getToken();
      const res = await api.get("/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const convos = Array.isArray(res.data) ? res.data : [];
      setConversations(convos);

      if (targetUserId && !activeConvo) {
        const existing = convos.find((c: Conversation) => c.partner.id === targetUserId);
        if (existing) {
          setActiveConvo(existing);
        } else {
          await startPlaceholderConvo(targetUserId);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (targetUserId && !activeConvo) {
        await startPlaceholderConvo(targetUserId);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const startPlaceholderConvo = async (userId: string) => {
    try {
      const token = await getToken();
      const res = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        const placeholder: Conversation = {
          id: 0,
          partner: {
            id: res.data.id,
            name: res.data.name,
            username: res.data.username,
            avatar_url: res.data.avatar_url,
          },
          last_message: null,
        };
        setActiveConvo(placeholder);
        setIsNewMessageModalOpen(false);
      }
    } catch (error) {
      console.error("Error starting placeholder convo:", error);
    }
  };

  const fetchMessages = async (convoId: number, partnerId?: string, isInitial = false) => {
    if (convoId === 0) {
      setMessages([]);
      return;
    }
    try {
      if (isInitial) setMessagesLoading(true);
      const token = await getToken();
      const res = await api.get(`/messages/${convoId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      if (currentUser?.id && partnerId) {
        socket.emit("mark_read", { senderId: currentUser.id, receiverId: partnerId, conversationId: convoId });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (isInitial) setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    // Poll for new conversations/messages every 10 seconds
    const interval = setInterval(() => fetchConversations(false), 10000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  useEffect(() => {
    if (activeConvo && activeConvo.id !== 0) {
      fetchMessages(activeConvo.id, activeConvo.partner.id, true);
      setIsAtBottom(true);
      setTimeout(() => scrollToBottom(true), 100);

      const interval = setInterval(() => {
        fetchMessages(activeConvo.id, activeConvo.partner.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvo?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size must not exceed 1MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 9) { // 10 seconds max
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSendMessage = async (e?: React.FormEvent, directImageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !selectedImage && !audioBlob && !directImageUrl) || sending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
    }

    setSending(true);
    try {
      const token = await getToken();
      let imageUrl = directImageUrl;

      if (selectedImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await api.post("/upload/image", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = uploadRes.data.url;
        setUploadingImage(false);
      }

      let audioUrl = undefined;
      if (audioBlob) {
        setIsUploadingAudio(true);
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice_message.webm");
        const uploadRes = await api.post("/upload/audio", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        audioUrl = uploadRes.data.url;
        setIsUploadingAudio(false);
      }

      const res = await api.post(
        "/messages",
        {
          conversationId: activeConvo?.id === 0 ? undefined : activeConvo?.id,
          recipientId: activeConvo?.id === 0 ? activeConvo?.partner.id : undefined,
          content: newMessage.trim(),
          replyToMessageId: replyingTo?.id,
          imageUrl: imageUrl,
          audioUrl: audioUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewMessage("");
      setReplyingTo(null);
      clearImage();
      clearAudio();

      if (activeConvo?.id === 0) {
        await fetchConversations();
      } else {
        setMessages((prev) => [...prev, res.data]);

        // Immediate local conversation list update
        setConversations((prev) => {
          const convoId = activeConvo?.id;
          const convoIndex = prev.findIndex(c => c.id === convoId);
          if (convoIndex === -1) return prev;
          const updated = [...prev];
          updated[convoIndex] = { ...updated[convoIndex], last_message: res.data, unread_count: 0 };
          const [moved] = updated.splice(convoIndex, 1);
          return [moved, ...updated];
        });
      }
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
      setUploadingImage(false);
      setIsUploadingAudio(false);
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
      const token = await getToken();
      await api.patch(`/messages/message/${messageId}/reaction`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic Update
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || {};
          const users = currentReactions[emoji] || [];
          const userId = currentUser!.id;

          if (users.includes(userId)) {
            // Remove
            const newUsers = users.filter(id => id !== userId);
            const newReactions = { ...currentReactions };
            if (newUsers.length === 0) delete newReactions[emoji];
            else newReactions[emoji] = newUsers;
            return { ...m, reactions: newReactions };
          } else {
            // Add
            return {
              ...m,
              reactions: {
                ...currentReactions,
                [emoji]: [...users, userId]
              }
            };
          }
        }
        return m;
      }));
    } finally {
      setReactingTo(null);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const token = await getToken();
      await api.delete(`/messages/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      // Use console only — no alert
    } finally {
      setReactingTo(null);
      setMessageMenuId(null);
      setDeletingMessageId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (activeConvo && activeConvo.partner.id && currentUser?.id) {
      socket.emit("typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConvo.partner.id });
      }, 2000);
    }
  };

  const filteredConversations = conversations.filter(
    (convo) =>
      convo.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo.partner.username &&
        convo.partner.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 80px)",
          padding: isMobile ? "24px" : "40px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "0.5px solid var(--border-hairline)",
            borderTopColor: "var(--text-primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  const sidebarWidth = isMobile ? "100%" : isTablet ? "320px" : "380px";

  return (
    <main
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? "calc(100vh - 64px)" : "calc(100vh - 0px)",
        maxWidth: "100%",
        margin: "0 auto",
        overflow: "hidden",
        backgroundColor: "var(--bg-page)",
      }}
    >
      {/* Sidebar */}
      {(!isMobile || !activeConvo) && (
        <div
          style={{
            width: sidebarWidth,
            minWidth: isMobile ? undefined : "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
            height: "100%",
            backgroundColor: "var(--bg-page)",
          }}
        >
          <div
            style={{
              padding: isMobile ? "20px 24px" : "28px 24px",
              borderBottom: "0.5px solid var(--border-hairline)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h1
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  flex: 1,
                  minWidth: 0
                }}
              >
                MESSAGES
              </h1>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--text-primary)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-input)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px" }}>
                  <NotePencil size={22} weight="bold" />
                </div>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                backgroundColor: "var(--bg-input)",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid var(--border-hairline)",
              }}
            >
              <MagnifyingGlass
                size={16}
                weight="thin"
                style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "none",
                  flex: 1,
                  outline: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  textTransform: "uppercase"
                }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
            }}
          >
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", flexShrink: 0, animation: "shimmer 1.5s infinite linear" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ width: "40%", height: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                      <div style={{ width: "70%", height: "12px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                    </div>
                  </div>
                ))}
                <style>{`
                  @keyframes shimmer {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                  }
                `}</style>
              </div>
            ) : conversations.length === 0 && !targetUserId ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "0.5px solid var(--border-hairline)"
                  }}
                >
                  <NotePencil
                    size={24}
                    weight="thin"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "14px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    NO CONVERSATIONS
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                    Start a conversation with someone from the community.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewMessageModalOpen(true)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase"
                  }}
                >
                  NEW MESSAGE
                </button>
              </div>
            ) : null}
            {!loading && filteredConversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => {
                  setActiveConvo(convo);
                  if (convo.unread_count && convo.unread_count > 0) {
                    setConversations(prev =>
                      prev.map(c => c.id === convo.id ? { ...c, unread_count: 0 } : c)
                    );
                  }
                }}
                style={{
                  padding: "20px",
                  cursor: "pointer",
                  backgroundColor: activeConvo?.id === convo.id ? "var(--bg-hover)" : "transparent",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  borderBottom: "0.5px solid var(--border-hairline)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeConvo?.id !== convo.id)
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (activeConvo?.id !== convo.id)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <AvailabilityBadge
                  avatarUrl={convo.partner.avatar_url}
                  name={convo.partner.name}
                  size={48}
                  isOG={convo.partner.is_og}
                  username={convo.partner.username}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {convo.partner.name}
                      <VerifiedBadge username={convo.partner.username} size="13px" />
                    </div>
                    {convo.last_message && (
                      <span style={{ fontSize: "10px", color: "var(--text-tertiary)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                        {new Date(convo.last_message.created_at).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                          ? new Date(convo.last_message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : new Date(convo.last_message.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: convo.unread_count && convo.unread_count > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: convo.unread_count && convo.unread_count > 0 ? 700 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <div style={{ display: "flex", gap: "6px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", alignItems: "center" }}>
                      {typingUsers[convo.partner.id] ? (
                        <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>typing...</span>
                      ) : convo.last_message ? (
                        <>
                          {convo.last_message.sender_id === currentUser?.id && (
                            <span style={{ color: "var(--text-tertiary)", fontWeight: 700, fontSize: "11px", fontFamily: "var(--font-mono)" }}>YOU:</span>
                          )}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {convo.last_message.content || (
                              convo.last_message.shared_post || convo.last_message.shared_post_id ? "Shared a post" :
                                convo.last_message.shared_project || convo.last_message.shared_project_id ? "Shared a project" :
                                  convo.last_message.audio_url ? "🎤 Voice Message" :
                                    (convo.last_message.image_url?.includes("giphy.com") || convo.last_message.image_url?.includes("tenor.com") || convo.last_message.image_url?.toLowerCase().endsWith(".gif")) ? "🎬 GIF" : "📷 Image"
                            )}
                          </span>
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </div>
                    {(convo.unread_count ?? 0) > 0 && (
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--text-primary)",
                        flexShrink: 0,
                        marginLeft: "8px"
                      }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      {(!isMobile || activeConvo) && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            backgroundColor: "var(--bg-page)",
          }}
        >
          {activeConvo ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: isMobile ? "20px" : "28px 24px",
                  borderBottom: "0.5px solid var(--border-hairline)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  backgroundColor: "var(--bg-page)",
                  flexShrink: 0,
                }}
              >
                {isMobile && (
                  <button
                    onClick={() => setActiveConvo(null)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      marginLeft: "-4px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CaretLeft
                      size={20}
                      weight="thin"
                    />
                  </button>
                )}
                <div
                  onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  <AvailabilityBadge
                    avatarUrl={activeConvo.partner.avatar_url}
                    name={activeConvo.partner.name}
                    size={36}
                    isOG={activeConvo.partner.is_og}
                    username={activeConvo.partner.username}
                  />
                </div>
                {messagesLoading && activeConvo.id === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ width: "120px", height: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                    <div style={{ width: "80px", height: "10px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", animation: "shimmer 1.5s infinite linear" }} />
                  </div>
                ) : (
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.05em"
                      }}
                      onClick={() => navigate(`/user/${activeConvo.partner.id}`)}
                    >
                      {activeConvo.partner.name.toUpperCase()}
                      <VerifiedBadge username={activeConvo.partner.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      @{activeConvo.partner.username || "user"}
                    </div>
                  </div>
                )}

              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: isMobile ? "20px 16px" : "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {messagesLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{
                        display: "flex",
                        flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                        gap: "12px",
                        alignItems: "flex-end"
                      }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", animation: "shimmer 1.5s infinite linear" }} />
                        <div style={{
                          maxWidth: "60%",
                          width: "200px",
                          height: "60px",
                          backgroundColor: "var(--bg-hover)",
                          borderRadius: "var(--radius-sm)",
                          animation: "shimmer 1.5s infinite linear"
                        }} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 && activeConvo.id !== 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "0.5px solid var(--border-hairline)"
                      }}
                    >
                      <ChatTeardropText
                        size={24}
                        weight="thin"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                        NO MESSAGES
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                        Say hello and start the conversation
                      </p>
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        maxWidth: isMobile ? "88%" : "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMine ? "flex-end" : "flex-start",
                        gap: "2px",
                        position: "relative"
                      }}
                      className="message-container"
                    >
                      {/* Name Label - Only show for received messages */}
                      {!isMine && (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          padding: "0 4px",
                          fontFamily: "var(--font-mono)"
                        }}>
                          {activeConvo.partner.name}
                        </span>
                      )}

                      {/* Reply Context */}
                      {msg.reply_to && (
                        <div
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "var(--bg-hover)",
                            borderLeft: "2px solid var(--text-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginBottom: "2px",
                            maxWidth: "100%",
                            cursor: "pointer",
                            opacity: 0.8
                          }}
                          onClick={() => {
                            const el = document.getElementById(`msg-${msg.reply_to?.id}`);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: "9px", textTransform: "uppercase", marginBottom: "2px" }}>
                            {msg.reply_to.sender_id === currentUser?.id ? "YOU" : activeConvo.partner.name}
                          </div>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {msg.reply_to.content || (
                              (msg.reply_to.image_url?.includes("giphy.com") || msg.reply_to.image_url?.includes("tenor.com") || msg.reply_to.image_url?.toLowerCase().endsWith(".gif")) ? "🎬 GIF" :
                                msg.reply_to.image_url ? "📷 Image" : ""
                            )}
                          </div>
                        </div>
                      )}

                      {/* Three-dots menu trigger - appears on hover */}
                      {isMine && (
                        <div
                          className="msg-dots-trigger"
                          style={{
                            position: "relative",
                            alignSelf: "flex-end",
                            marginBottom: "-2px"
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setMessageMenuId(messageMenuId === msg.id ? null : msg.id); }}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "2px",
                              cursor: "pointer",
                              color: "var(--text-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "var(--radius-sm)",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <DotsThree size={18} weight="bold" />
                          </button>

                          {/* Small dropdown menu */}
                          {messageMenuId === msg.id && (
                            <div
                              className="message-action-menu"
                              style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: "4px",
                                backgroundColor: "var(--bg-page)",
                                border: "0.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-sm)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                zIndex: 1000,
                                minWidth: "160px",
                                overflow: "hidden",
                                animation: "reactionFadeUp 0.15s ease-out"
                              }}
                            >
                              {deletingMessageId === msg.id ? (
                                <div style={{ padding: "12px 14px" }}>
                                  <div style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--text-primary)",
                                    marginBottom: "10px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em"
                                  }}>
                                    Delete for everyone?
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeletingMessageId(null); }}
                                      style={{
                                        flex: 1,
                                        padding: "7px 12px",
                                        border: "0.5px solid var(--border-hairline)",
                                        borderRadius: "var(--radius-sm)",
                                        background: "transparent",
                                        color: "var(--text-primary)",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        transition: "background 0.15s"
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                      style={{
                                        flex: 1,
                                        padding: "7px 12px",
                                        border: "none",
                                        borderRadius: "var(--radius-sm)",
                                        backgroundColor: "#ef4444",
                                        color: "#fff",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        transition: "opacity 0.15s"
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletingMessageId(msg.id); }}
                                  style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    background: "none",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                    color: "#ef4444",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                  <Trash size={15} weight="bold" />
                                  Delete Message
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        id={`msg-${msg.id}`}
                        onMouseDown={() => {
                          if (isMobile) return;
                          longPressTimeoutRef.current = setTimeout(() => setReactingTo(msg.id), 500);
                        }}
                        onMouseUp={() => {
                          if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
                        }}
                        onMouseLeave={() => {
                          if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
                        }}
                        onTouchStart={() => {
                          longPressTimeoutRef.current = setTimeout(() => setReactingTo(msg.id), 500);
                        }}
                        onTouchEnd={() => {
                          if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setReactingTo(msg.id);
                        }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isMine ? "var(--text-primary)" : "var(--bg-page)",
                          color: isMine ? "var(--bg-page)" : "var(--text-primary)",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          border: "0.5px solid var(--border-hairline)",
                          wordBreak: "break-word",
                          position: "relative",
                          cursor: "pointer",
                          userSelect: "none",
                          WebkitUserSelect: "none"
                        }}
                      >
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt=""
                            style={{
                              maxWidth: "100%",
                              maxHeight: "300px",
                              borderRadius: "var(--radius-sm)",
                              marginBottom: msg.content ? "8px" : 0,
                              display: "block",
                              cursor: "pointer"
                            }}
                            onClick={() => setPreviewImage(msg.image_url!)}
                          />
                        )}
                        {msg.audio_url && (
                          <div style={{ marginTop: msg.image_url ? "8px" : 0, marginBottom: msg.content ? "8px" : 0 }}>
                            <audio
                              src={msg.audio_url}
                              controls
                              style={{
                                height: "36px",
                                maxWidth: "220px",
                                outline: "none",
                                // make the audio player match the theme slightly better
                                filter: isMine ? "invert(1) hue-rotate(180deg)" : "invert(0)"
                              }}
                            />
                          </div>
                        )}
                        {msg.content && (
                          <div>
                            {(() => {
                              const urlRegex = /(https?:\/\/[^\s]+)/g;
                              const parts = msg.content.split(urlRegex);
                              return parts.map((part, i) => {
                                if (part.match(urlRegex)) {
                                  return (
                                    <a
                                      key={i}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: isMine ? "inherit" : "var(--text-primary)",
                                        textDecoration: "underline",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                      }}
                                    >
                                      {part}
                                    </a>
                                  );
                                }
                                return part;
                              });
                            })()}
                          </div>
                        )}

                        {/* Shared Post Preview */}
                        {msg.shared_post && (
                          <div
                            onClick={(e) => { e.stopPropagation(); navigate(`/post/${msg.shared_post?.id}`); }}
                            style={{
                              marginTop: msg.content ? "12px" : 0,
                              backgroundColor: isMine ? "rgba(128,128,128,0.15)" : "var(--bg-hover)",
                              borderRadius: "var(--radius-sm)",
                              border: "0.5px solid var(--border-hairline)",
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            {msg.shared_post.images && msg.shared_post.images[0] && (
                              <img
                                src={msg.shared_post.images[0]}
                                alt=""
                                style={{ width: "100%", height: "120px", objectFit: "cover" }}
                              />
                            )}
                            <div style={{ padding: "12px" }}>
                              <div style={{ fontSize: "9px", fontWeight: 800, fontFamily: "var(--font-mono)", color: isMine ? "inherit" : "var(--text-tertiary)", opacity: isMine ? 0.6 : 1, textTransform: "uppercase", marginBottom: "4px" }}>
                                Shared Post • {msg.shared_post.user?.name || "User"}
                              </div>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: isMine ? "inherit" : "var(--text-primary)", marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {msg.shared_post.title || "Untitled Post"}
                              </div>
                              <div style={{ fontSize: "11px", color: isMine ? "inherit" : "var(--text-secondary)", opacity: isMine ? 0.8 : 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {msg.shared_post.content}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Shared Project Preview */}
                        {msg.shared_project && (
                          <div
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${msg.shared_project?.id}`); }}
                            style={{
                              marginTop: msg.content ? "12px" : 0,
                              backgroundColor: isMine ? "rgba(128,128,128,0.15)" : "var(--bg-hover)",
                              borderRadius: "var(--radius-sm)",
                              border: "0.5px solid var(--border-hairline)",
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            {msg.shared_project.cover_image && (
                              <img
                                src={msg.shared_project.cover_image}
                                alt=""
                                style={{ width: "100%", height: "120px", objectFit: "cover" }}
                              />
                            )}
                            <div style={{ padding: "12px" }}>
                              <div style={{ fontSize: "9px", fontWeight: 800, fontFamily: "var(--font-mono)", color: isMine ? "inherit" : "var(--text-tertiary)", opacity: isMine ? 0.6 : 1, textTransform: "uppercase", marginBottom: "4px" }}>
                                Shared Project • {msg.shared_project.user?.name || "User"}
                              </div>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: isMine ? "inherit" : "var(--text-primary)", marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {msg.shared_project.title || "Untitled Project"}
                              </div>
                              <div style={{ fontSize: "11px", color: isMine ? "inherit" : "var(--text-secondary)", opacity: isMine ? 0.8 : 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {msg.shared_project.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "2px 6px 0", alignSelf: isMine ? "flex-end" : "flex-start" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-tertiary)",
                            fontWeight: 500,
                            fontFamily: "var(--font-mono)"
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="reply-button"
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: "var(--text-tertiary)",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                        >
                          Reply
                        </button>



                        {isMine && msg.is_read && (() => {
                          let lastMyMsgIdx = -1;
                          for (let i = messages.length - 1; i >= 0; i--) {
                            if (messages[i].sender_id === currentUser?.id) {
                              lastMyMsgIdx = i;
                              break;
                            }
                          }
                          return idx === lastMyMsgIdx;
                        })() && (
                            <span style={{ fontSize: "10px", color: "var(--text-primary)", fontWeight: 700, marginLeft: "4px", fontFamily: "var(--font-mono)" }}>SEEN</span>
                          )}
                      </div>

                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          marginTop: "2px",
                          alignSelf: isMine ? "flex-end" : "flex-start",
                          zIndex: 2
                        }}>
                          {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                            const hasReacted = userIds.includes(currentUser!.id);
                            return (
                              <div
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                style={{
                                  padding: "2px 6px",
                                  backgroundColor: hasReacted ? "var(--text-primary)" : "var(--bg-hover)",
                                  color: hasReacted ? "var(--bg-page)" : "var(--text-primary)",
                                  borderRadius: "var(--radius-pill)",
                                  fontSize: "11px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  cursor: "pointer",
                                  border: "0.5px solid var(--border-hairline)",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                <span>{emoji}</span>
                                <span style={{ fontSize: "9px", fontWeight: 800 }}>{userIds.length}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Emoji Picker Overlay */}
                      {reactingTo === msg.id && (
                        <div
                          className="emoji-picker-overlay"
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            [isMine ? "right" : "left"]: 0,
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-pill)",
                            padding: "6px 12px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                            border: "0.5px solid var(--border-hairline)",
                            display: "flex",
                            gap: "10px",
                            zIndex: 1000,
                            animation: "reactionFadeUp 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                            marginBottom: "10px"
                          }}
                        >
                          {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "20px",
                                padding: "4px",
                                cursor: "pointer",
                                transition: "transform 0.15s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.3)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeConvo && typingUsers[activeConvo.partner.id] && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-hover)",
                      border: "0.5px solid var(--border-hairline)",
                      marginTop: "4px"
                    }}
                  >
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }} />
                    <div style={{ backgroundColor: "var(--text-primary)", width: "6px", height: "6px", borderRadius: "var(--radius-sm)", animation: "typing-bounce 1.4s infinite ease-in-out both" }} />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: isMobile ? "12px 16px" : "16px 24px",
                  backgroundColor: "var(--bg-page)",
                  borderTop: "0.5px solid var(--border-hairline)",
                  flexShrink: 0,
                  position: "relative"
                }}
              >
                {/* Reply Preview */}
                {replyingTo && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Replying to {replyingTo.sender_id === currentUser?.id ? "yourself" : activeConvo.partner.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {replyingTo.content || (replyingTo.audio_url ? "🎤 Voice Message" : (replyingTo.image_url ? "📷 Image" : ""))}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-primary)",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          border: "0.5px solid var(--border-hairline)"
                        }}
                      />
                      <button
                        onClick={clearImage}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-4px",
                          width: "-5px",
                          height: "15px",
                          borderRadius: "50%",
                          backgroundColor: "#fff",
                          color: "#000",
                          border: "1px solid var(--border-hairline)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{selectedImage?.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                        {(selectedImage?.size! / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Preview */}
                {audioPreviewUrl && !isRecording && (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-hover)",
                      borderBottom: "0.5px solid var(--border-hairline)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      animation: "slide-down 0.2s ease-out"
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                      <audio src={audioPreviewUrl} controls style={{ height: "30px", flex: 1 }} />
                    </div>
                    <button
                      onClick={clearAudio}
                      type="button"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                        border: "0.5px solid var(--border-hairline)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: 0,
                        margin: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                        e.currentTarget.style.color = "var(--text-error, #ff4444)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-input)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                    >
                      <X size={16} weight="bold" color="currentColor" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 0 0" }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--radius-sm)",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: "transparent",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <ImageIcon size={30} weight="regular" />
                  </button>

                  {/* Gif Button */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                        backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => {
                        if (!isGifPickerOpen) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Gif size={30} weight={isGifPickerOpen ? "fill" : "regular"} />
                    </button>

                    {isGifPickerOpen && (
                      <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        marginBottom: "12px",
                        zIndex: 2000
                      }}>
                        <GifPicker
                          onSelect={(gifUrl) => {
                            // Direct send GIF
                            handleSendMessage(undefined, gifUrl);
                            setIsGifPickerOpen(false);
                          }}
                          onClose={() => setIsGifPickerOpen(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mic Button */}
                  {!audioPreviewUrl && (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                        backgroundColor: isRecording ? "var(--text-error, #ff4444)" : "transparent",
                        color: isRecording ? "#fff" : "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!isRecording) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecording) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {isRecording ? <StopCircle size={30} weight="fill" /> : <Microphone size={30} weight="regular" />}
                    </button>
                  )}

                  <div style={{ flex: 1, position: "relative" }}>
                    {isRecording ? (
                      <div
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "0.5px solid var(--border-hairline)",
                          backgroundColor: "var(--bg-input)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          color: "var(--text-error, #ff4444)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "currentColor", animation: "pulse 1.5s infinite" }} />
                        Recording 0:0{recordingTime} / 0:10
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as unknown as React.FormEvent);
                          }
                        }}
                        placeholder={audioBlob ? "Message attached with voice recording..." : "Type a message..."}
                        disabled={!!audioBlob}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "0.5px solid var(--border-hairline)",
                          outline: "none",
                          backgroundColor: audioBlob ? "var(--bg-hover)" : "var(--bg-input)",
                          fontSize: "14px",
                          color: "var(--text-primary)",
                          transition: "all 0.15s ease",
                          minWidth: 0,
                          opacity: audioBlob ? 0.7 : 1,
                        }}
                        onFocus={(e) => {
                          if (!audioBlob) e.currentTarget.style.borderColor = "var(--text-primary)";
                        }}
                        onBlur={(e) => {
                          if (!audioBlob) e.currentTarget.style.borderColor = "var(--border-hairline)";
                        }}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage && !audioBlob) || sending || uploadingImage || isUploadingAudio || isRecording}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--radius-sm)",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: (newMessage.trim() || selectedImage || audioBlob) ? "var(--text-primary)" : "transparent",
                      color: (newMessage.trim() || selectedImage || audioBlob) ? "var(--bg-page)" : "var(--text-tertiary)",
                      cursor: (newMessage.trim() || selectedImage) ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {uploadingImage || isUploadingAudio ? (
                      <ArrowClockwise size={20} weight="thin" className="spin-animation" />
                    ) : (
                      <PaperPlaneTilt
                        size={20}
                        weight="thin"
                      />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "24px",
                padding: "40px",
                textAlign: "center",
                backgroundColor: "var(--bg-page)",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "0.5px solid var(--border-hairline)"
                }}
              >
                <ChatTeardropText
                  size={32}
                  weight="thin"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  YOUR MESSAGES
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.5,
                    maxWidth: "280px",
                  }}
                >
                  Select a conversation from the list to start chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSelectUser={(user) => startPlaceholderConvo(user.id)}
      />

      {/* Image Previewer Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.2s ease",
            padding: "20px"
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backdropFilter: "blur(10px)",
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
          >
            <X size={24} weight="bold" />
          </button>

          <img
            src={previewImage}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              animation: "imageScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes imageScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reactionFadeUp {
          from { transform: translateY(10px) scale(0.8); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .message-container .reply-button,
        .message-container .msg-dots-trigger {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .message-container:hover .reply-button,
        .message-container:hover .msg-dots-trigger {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .message-container .reply-button,
          .message-container .msg-dots-trigger {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
