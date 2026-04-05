import { motion } from "framer-motion";
import { Rocket } from "phosphor-react";

interface GoldenShipBadgeProps {
  size?: number;
  className?: string;
}

export default function GoldenShipBadge({ size = 16, className = "" }: GoldenShipBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -2, 0]
      }}
      transition={{ 
        duration: 0.5,
        y: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className={`inline-flex items-center justify-center ${className}`}
      title="The Ship Week Winner"
      style={{
        filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))",
        color: "#FFD700"
      }}
    >
      <Rocket size={size} weight="fill" />
    </motion.div>
  );
}
