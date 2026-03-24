import { useState, useEffect, useRef } from "react";
import { MagnifyingGlass, X } from "phosphor-react";

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const GIPHY_API_KEY = "0nC72fAImJhQSw0M6PQ7rxlplj9yKQqA";

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div style={{
      width: "320px",
      maxWidth: "90vw",
      height: "400px",
      maxHeight: "60vh",
      backgroundColor: "var(--bg-page)",
      border: "0.5px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
      animation: "reactionFadeUp 0.15s ease-out",
      zIndex: 2000
    }}>
      {/* Header */}
      <div style={{
        padding: "12px",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--bg-hover)",
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          gap: "8px",
          border: "0.5px solid var(--border-hairline)"
        }}>
          <MagnifyingGlass size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="SEARCH GIFS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "12px",
              color: "var(--text-primary)",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase"
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
            padding: "4px",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      {/* Grid */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridAutoRows: "min-content",
          gap: "8px"
        }}
      >
        {gifs.map((gif, idx) => (
          <div
            key={`${gif.id}-${idx}`}
            onClick={() => onSelect(gif.images.fixed_height.url)}
            style={{
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              overflow: "hidden",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "0.5px solid var(--border-hairline)",
              position: "relative",
              height: "100px" // Fixed height for commonality, but can be improved
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
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
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: "16px" }}>
            <div style={{
              width: "18px",
              height: "18px",
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
        padding: "8px 12px",
        borderTop: "0.5px solid var(--border-hairline)",
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "var(--bg-hover)",
        alignItems: "center"
      }}>
        <span style={{ 
          fontSize: "9px", 
          color: "var(--text-tertiary)", 
          fontWeight: 800, 
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em"
        }}>
          POWERED BY GIPHY
        </span>
      </div>

      <style>{`
        @keyframes reactionFadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
