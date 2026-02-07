import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface VerifiedBadgeProps {
    username?: string | null;
    size?: string;
}

export default function VerifiedBadge({ username, size = "16px" }: VerifiedBadgeProps) {
    if (username === "amin.ceo") {
        return (
            <FontAwesomeIcon
                icon={faCheckCircle}
                style={{
                    fontSize: size,
                    color: "#2B7FFF", // Modern blue color
                    marginLeft: "4px",
                    verticalAlign: "middle"
                }}
            />
        );
    }
    return null;
}
