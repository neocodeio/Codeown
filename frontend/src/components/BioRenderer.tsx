import { useNavigate } from "react-router-dom";

interface BioRendererProps {
    bio: string;
}

export default function BioRenderer({ bio }: BioRendererProps) {
    const navigate = useNavigate();

    const handleMentionClick = (username: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/${username.toLowerCase()}`);
    };

    const parseBio = (text: string) => {
        const elements: (string | React.JSX.Element)[] = [];
        let localKey = 0;

        // Combined regex for mentions and URLs
        // Mentions now require a whitespace or start of string to avoid matching inside URLs
        const combinedRegex = /((?:^|\s)@\w+(?:\.\w+)*)|(https?:\/\/[^\s]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = combinedRegex.exec(text)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                elements.push(text.slice(lastIndex, match.index));
            }

            if (match[1]) {
                // Mention - match[1] might start with a space
                const fullMatch = match[1];
                const spacePrefix = fullMatch && fullMatch.startsWith(' ') ? ' ' : '';
                const username = fullMatch.trim().slice(1); // Remove space and @

                if (spacePrefix) {
                    elements.push(spacePrefix);
                }

                elements.push(
                    <span
                        key={`mention-${localKey++}`}
                        onClick={(e) => handleMentionClick(username, e)}
                        style={{
                            color: "var(--text-primary)",
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                            textDecorationColor: "var(--border-hairline)"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "var(--border-hairline)")}
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
                            color: "var(--text-primary)",
                            textDecoration: "underline",
                            textDecorationColor: "var(--border-hairline)",
                            fontWeight: "700",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "var(--border-hairline)")}
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
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text-primary)" }}>
            {parseBio(bio)}
        </div>
    );
}
