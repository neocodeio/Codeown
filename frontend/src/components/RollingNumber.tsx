import { useEffect, useState, memo, useRef } from "react";

interface RollingNumberProps {
    value: number;
    fontSize?: string;
    fontWeight?: string | number;
    color?: string;
}

const RollingNumber = memo(({ value, fontSize = "inherit", fontWeight = "inherit", color = "inherit" }: RollingNumberProps) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);
    const [direction, setDirection] = useState<"up" | "down">("up");
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (value !== displayValue) {
            // Cancel previous timer if it exists to reset the animation cycle
            if (timerRef.current) clearTimeout(timerRef.current);
            
            setDirection(value > displayValue ? "up" : "down");
            setPrevValue(displayValue);
            setIsAnimating(true);
            
            timerRef.current = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
                timerRef.current = null;
            }, 450);

            return () => {
                if (timerRef.current) clearTimeout(timerRef.current);
            };
        }
    }, [value, displayValue]);

    if (value === 0 && !isAnimating) return null;

    return (
        <span style={{ 
            display: "inline-block", 
            overflow: "hidden", 
            height: "1.25em", 
            position: "relative",
            lineHeight: "1.25em",
            fontSize,
            fontWeight,
            color,
            verticalAlign: "middle"
        }}>
            <style>{`
                @keyframes rollingSlideInUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes rollingSlideOutUp {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-100%); opacity: 0; }
                }
                @keyframes rollingSlideInDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes rollingSlideOutDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
                .rolling-in-up { animation: rollingSlideInUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-out-up { animation: rollingSlideOutUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-in-down { animation: rollingSlideInDown 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-out-down { animation: rollingSlideOutDown 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
            
            <div style={{ position: "relative", height: "100%", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isAnimating ? (
                    <>
                        <span style={{ visibility: "hidden" }}>{Math.max(value, prevValue)}</span>
                        
                        <div key={`out-${prevValue}-${value}`} className={direction === "up" ? "rolling-out-up" : "rolling-out-down"} 
                             style={{ position: "absolute", width: "100%", textAlign: "center" }}>
                            {prevValue}
                        </div>
                        <div key={`in-${value}-${prevValue}`} className={direction === "up" ? "rolling-in-up" : "rolling-in-down"} 
                             style={{ position: "absolute", width: "100%", textAlign: "center" }}>
                            {value}
                        </div>
                    </>
                ) : (
                    <span key={`stable-${displayValue}`}>{displayValue}</span>
                )}
            </div>
        </span>
    );
});

export default RollingNumber;
