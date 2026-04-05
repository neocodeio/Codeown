import { Rocket } from "phosphor-react";
import { motion } from "framer-motion";

interface GoldenShipBadgeProps {
    show?: boolean;
    size?: number;
}

export default function GoldenShipBadge({ show, size = 18 }: GoldenShipBadgeProps) {
    if (!show) return null;

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                boxShadow: "0 0 10px rgba(255, 215, 0, 0.4)",
                marginLeft: "4px",
                color: "#fff",
                verticalAlign: "middle"
            }}
            title="Voted Weekly Winner"
        >
            <Rocket size={size} weight="fill" />
            <style>{`
                @keyframes badgeGlow {
                    0% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.4); }
                    50% { box-shadow: 0 0 18px rgba(255, 215, 0, 0.8); }
                    100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.4); }
                }
                .golden-ship-glow {
                    animation: badgeGlow 2s infinite ease-in-out;
                }
            `}</style>
        </motion.div>
    );
}
