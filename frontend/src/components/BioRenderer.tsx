import { useNavigate } from "react-router-dom";

interface BioRendererProps {
    bio: string;
}

export default function BioRenderer({ bio }: BioRendererProps) {
    const navigate = useNavigate();

    const handleMentionClick = (username: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/search?q=@${username}`);
    };

    const parseBio = (text: string) => {
        const elements: (string | React.JSX.Element)[] = [];
        let localKey = 0;

        // Combined regex for mentions and URLs
        const combinedRegex = /(@\w+)|(https?:\/\/[^\s]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = combinedRegex.exec(text)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                elements.push(text.slice(lastIndex, match.index));
            }

            if (match[1]) {
                // Mention
                const username = match[1].slice(1);
                elements.push(
                    <span
                        key={`mention-${localKey++}`}
                        onClick={(e) => handleMentionClick(username, e)}
                        style={{
                            color: "#212121",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                        @{username}
                    </span>
                );
            } else if (match[2]) {
                // URL
                const url = match[2];
                elements.push(
                    <a
                        key={`link-${localKey++}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            color: "#212121",
                            textDecoration: "none",
                            fontWeight: "600",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                        {url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                );
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            elements.push(text.slice(lastIndex));
        }

        return elements;
    };

    return (
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {parseBio(bio)}
        </div>
    );
}
