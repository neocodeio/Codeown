import { useState, useEffect, useRef } from "react";
import { MagnifyingGlass, X } from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const GIPHY_API_KEY = "0nC72fAImJhQSw0M6PQ7rxlplj9yKQqA";

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  const fetchGifs = async (searchQuery = "", currentOffset = 0) => {
    setLoading(true);
    try {
      const endpoint = searchQuery
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&offset=${currentOffset}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&offset=${currentOffset}&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();

      const results = data.data || [];
      if (currentOffset === 0) {
        setGifs(results);
      } else {
        setGifs(prev => [...prev, ...results]);
      }

      setOffset(currentOffset + results.length);
      setTotalCount(data.pagination?.total_count || 0);
    } catch (error) {
      console.error("Error fetching GIFs from Giphy:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchGifs(query, 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50 && offset < totalCount && !loading) {
        fetchGifs(query, offset);
      }
    }
  };

  return (
    <div ref={containerRef} style={{
      width: isMobile ? "100vw" : "400px",
      maxWidth: isMobile ? "100vw" : "calc(100vw - 40px)",
      height: isMobile ? "100vh" : "500px",
      maxHeight: isMobile ? "100vh" : "70vh",
      backgroundColor: "var(--bg-page)",
      border: isMobile ? "none" : "0.5px solid var(--border-hairline)",
      borderRadius: isMobile ? "0px" : "20px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      overflow: "hidden",
      animation: isMobile ? "mobileSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "reactionFadeUp 0.15s ease-out",
      zIndex: 2000
    }}>
      {/* Header */}
      <div style={{
        padding: "16px",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        paddingTop: isMobile ? "env(safe-area-inset-top, 20px)" : "16px"
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--bg-hover)",
          padding: "10px 14px",
          borderRadius: "14px",
          gap: "10px",
          border: "0.5px solid var(--border-hairline)"
        }}>
          <MagnifyingGlass size={18} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search GIFs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          />
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            padding: "6px",
            transition: "all 0.15s ease",
            borderRadius: "50%"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={24} weight="bold" />
        </button>
      </div>

      {/* Grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="gif-grid"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridAutoRows: "min-content",
          gap: "12px"
        }}
      >
        {gifs.map((gif, idx) => (
          <div
            key={`${gif.id}-${idx}`}
            onClick={() => onSelect(gif.images.fixed_height.url)}
            style={{
              backgroundColor: "var(--bg-hover)",
              borderRadius: "12px",
              cursor: "pointer",
              overflow: "hidden",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "0.5px solid var(--border-hairline)",
              position: "relative",
              height: "120px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            <img
              src={gif.images.preview_gif.url}
              alt={gif.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
              loading="lazy"
            />
          </div>
        ))}
        {loading && (
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: "20px" }}>
            <div style={{
              width: "24px",
              height: "24px",
              border: "2px solid var(--border-hairline)",
              borderTopColor: "var(--text-primary)",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              margin: "0 auto"
            }} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 16px",
        borderTop: "0.5px solid var(--border-hairline)",
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "var(--bg-hover)",
        alignItems: "center"
      }}>
        <span style={{
          fontSize: "11px",
          color: "var(--text-tertiary)",
          fontWeight: 600,
        }}>
          Powered by Giphy
        </span>
      </div>

      <style>{`
        @keyframes reactionFadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mobileSlideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .gif-grid::-webkit-scrollbar {
          width: 6px;
        }
        .gif-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .gif-grid::-webkit-scrollbar-thumb {
          background: var(--border-hairline);
          borderRadius: 10px;
        }
        .gif-grid::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}
