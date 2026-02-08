import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface VerifiedBadgeProps {
    username?: string | null;
    size?: string;
}

export default function VerifiedBadge({ username, size = "6px" }: VerifiedBadgeProps) {
    if (username?.toLowerCase() === "amin.ceo") {
        return (
            <FontAwesomeIcon
                icon={faCheckCircle}
                title="Verified Official Account"
                style={{
                    fontSize: size,
                    color: "#2B7FFF", // High-visibility premium blue
                    marginLeft: "6px",
                    verticalAlign: "middle",
                    flexShrink: 0,
                    transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    cursor: "help"
                }}
            />
        );
    }
    return null;
}
