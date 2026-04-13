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
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
  onKeyDown,
  transparent = false,
}: MentionInputProps, ref) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [trigger, setTrigger] = useState<"@" | "#" | null>(null);
  const [triggerStart, setTriggerStart] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Common popular tags to suggest for hashtags
  const defaultHashtags: User[] = [
    { id: "1", name: "programmers", username: "programmers", avatar_url: null },
    { id: "2", name: "developers", username: "developers", avatar_url: null },
    { id: "3", name: "javascript", username: "javascript", avatar_url: null },
    { id: "4", name: "coding", username: "coding", avatar_url: null },
    { id: "5", name: "webdev", username: "webdev", avatar_url: null },
    { id: "6", name: "react", username: "react", avatar_url: null },
    { id: "7", name: "typescript", username: "typescript", avatar_url: null },
    { id: "8", name: "open-source", username: "open-source", avatar_url: null },
    { id: "9", name: "bugs", username: "bugs", avatar_url: null },
    { id: "10", name: "shipit", username: "shipit", avatar_url: null }
  ];

  useImperativeHandle(ref, () => textareaRef.current!);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch users when search query changes
  useEffect(() => {
    if (trigger === "#") {
      const filtered = defaultHashtags.filter(h => h.username?.toLowerCase().includes(debouncedQuery.toLowerCase()));
      setSuggestions(filtered);
      setSelectedIndex(0);
      return;
    }

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
  }, [debouncedQuery, trigger]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Auto-resize logic
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Check for triggers: @ (mention) or # (hashtag)
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const lastHashIndex = textBeforeCursor.lastIndexOf("#");

    const lastTriggerIndex = Math.max(lastAtIndex, lastHashIndex);

    if (lastTriggerIndex !== -1) {
      const currentTrigger = textBeforeCursor[lastTriggerIndex] as "@" | "#";
      const textAfterTrigger = textBeforeCursor.slice(lastTriggerIndex + 1);

      // Trigger if there's no space/newline between trigger and cursor
      if (!textAfterTrigger.includes(" ") && !textAfterTrigger.includes("\n")) {
        setTriggerStart(lastTriggerIndex);
        setTrigger(currentTrigger);
        setSearchQuery(textAfterTrigger);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setTriggerStart(null);
    setTrigger(null);
    setSearchQuery("");
  }, [onChange]);

  const insertSuggestion = useCallback((suggestion: User) => {
    if (triggerStart === null) return;

    const beforeTrigger = value.slice(0, triggerStart);
    const afterCursor = value.slice(cursorPosition);
    const suggestionText = `${trigger}${suggestion.username || suggestion.name.replace(/\s+/g, "")} `;

    const newValue = beforeTrigger + suggestionText + afterCursor;
    onChange(newValue);

    // Reset state
    setShowSuggestions(false);
    setTriggerStart(null);
    setTrigger(null);
    setSearchQuery("");
    setSuggestions([]);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = triggerStart + suggestionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [triggerStart, cursorPosition, value, onChange, trigger]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Explicitly handle Ctrl+Enter to add a new line as requested
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const val = e.currentTarget.value;
      const newVal = val.substring(0, start) + "\n" + val.substring(end);
      onChange(newVal);
      
      // Manually set cursor position after the new line
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + 1;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
      return;
    }

    if (onKeyDown) onKeyDown(e);

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
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, insertSuggestion, onKeyDown, onChange]);

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=000&color=fff&size=64&bold=true&font-size=0.5`;
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

  // Auto-resize on initial mount and value changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, minHeight]);

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
          padding: transparent ? "0" : "16px",
          border: transparent ? "none" : "0.5px solid var(--border-hairline)",
          borderRadius: "0px",
          fontSize: transparent ? "18px" : "14px",
          fontFamily: "var(--font-main)",
          resize: "none",
          outline: "none",
          transition: "border-color 0.15s ease",
          color: "var(--text-primary)",
          backgroundColor: transparent ? "transparent" : "var(--bg-input)",
          boxSizing: "border-box",
          lineHeight: 1.5,
          fontWeight: 400,
          overflow: "hidden", // Crucial for auto-resize
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
            marginTop: "8px",
            backgroundColor: "var(--bg-page)",
            borderRadius: "var(--radius-sm)",
            border: "0.5px solid var(--border-hairline)",
            boxShadow: "none",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 100,
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 600 }}>
              Loading...
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 600 }}>
              {searchQuery ? "No users found" : "Type to search"}
            </div>
          ) : (
            suggestions.map((user, index) => (
              <div
                key={user.id}
                onClick={() => insertSuggestion(user)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor: index === selectedIndex ? "var(--bg-hover)" : "transparent",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {trigger === "#" ? (
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-hover)",
                    border: "0.5px solid var(--border-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                     fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--text-tertiary)",
                  }}>
                    #
                  </div>
                ) : (
                  <img
                    src={user.avatar_url || getAvatarUrl(user.name)}
                    alt={user.name}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      objectFit: "cover",
                      border: "0.5px solid var(--border-hairline)",
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {trigger === "#" ? user.username : user.name}
                  </div>
                   {user.username && trigger === "@" && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 500
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
