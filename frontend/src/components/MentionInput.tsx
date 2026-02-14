import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import api from "../api/axios";
import { useDebounce } from "../hooks/useDebounce";

interface User {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  style?: React.CSSProperties;
  onFocus?: () => void;
  onBlur?: () => void;
  transparent?: boolean;
}

const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(function MentionInput({
  value,
  onChange,
  placeholder = "What's on your mind?",
  minHeight = "150px",
  style = {},
  onFocus,
  onBlur,
  transparent = false,
}: MentionInputProps, ref) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => textareaRef.current!);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch users when search query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search/users?q=${encodeURIComponent(debouncedQuery)}`);
        setSuggestions(res.data || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Error fetching users:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for @ mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space after @, which would end the mention
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionStart(lastAtIndex);
        setSearchQuery(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionStart(null);
    setSearchQuery("");
  }, [onChange]);

  const insertMention = useCallback((user: User) => {
    if (mentionStart === null) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(cursorPosition);
    const mentionText = `@${user.username || user.name.replace(/\s+/g, "")} `;

    const newValue = beforeMention + mentionText + afterCursor;
    onChange(newValue);

    // Reset state
    setShowSuggestions(false);
    setMentionStart(null);
    setSearchQuery("");
    setSuggestions([]);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [mentionStart, cursorPosition, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention]);

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=212121&color=ffffff&size=64&bold=true&font-size=0.5`;
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight,
          padding: transparent ? "0" : "12px 16px",
          border: transparent ? "none" : "1px solid #e4e7eb",
          borderRadius: transparent ? "0" : "25px",
          fontSize: transparent ? "20px" : "16px",
          fontFamily: "inherit",
          resize: "none",
          outline: "none",
          transition: "all 0.15s",
          color: "#0f172a",
          backgroundColor: transparent ? "transparent" : "#ffffff",
          boxSizing: "border-box",
          lineHeight: 1.5,
          fontWeight: transparent ? 500 : 400,
          ...style,
        }}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e4e7eb",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            maxHeight: "240px",
            overflowY: "auto",
            zIndex: 100,
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
              Loading...
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
              {searchQuery ? "No users found" : "Type to search users"}
            </div>
          ) : (
            suggestions.map((user, index) => (
              <div
                key={user.id}
                onClick={() => insertMention(user)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  backgroundColor: index === selectedIndex ? "#f0f0f0" : "transparent",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <img
                  src={user.avatar_url || getAvatarUrl(user.name)}
                  alt={user.name}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e4e7eb",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.name}
                  </div>
                  {user.username && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#212121",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

export default MentionInput;
