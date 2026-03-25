import { useEffect, useState, memo } from "react";

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

    useEffect(() => {
        if (value !== displayValue) {
            setDirection(value > displayValue ? "up" : "down");
            setPrevValue(displayValue);
            setIsAnimating(true);
            
            // Short delay to allow browser to register the state change before finishing animation
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
            }, 300); // Animation duration match

            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    return (
        <span style={{ 
            display: "inline-flex", 
            overflow: "hidden", 
            height: "1.2em", 
            position: "relative",
            verticalAlign: "bottom",
            lineHeight: "1.2em",
            fontSize,
            fontWeight,
            color
        }}>
            <style>{`
                @keyframes slideUpIn {
                    from { transform: translateY(1.2em); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideUpOut {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-1.2em); opacity: 0; }
                }
                @keyframes slideDownIn {
                    from { transform: translateY(-1.2em); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDownOut {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(1.2em); opacity: 0; }
                }
                .rolling-digit-in-up { animation: slideUpIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-digit-out-up { animation: slideUpOut 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-digit-in-down { animation: slideDownIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .rolling-digit-out-down { animation: slideDownOut 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
            
            {isAnimating ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <div className={direction === "up" ? "rolling-digit-out-up" : "rolling-digit-out-down"} style={{ position: "absolute", top: 0, left: 0 }}>
                        {prevValue}
                    </div>
                    <div className={direction === "up" ? "rolling-digit-in-up" : "rolling-digit-in-down"} style={{ position: "absolute", top: 0, left: 0 }}>
                        {value}
                    </div>
                </div>
            ) : (
                <span>{displayValue}</span>
            )}
        </span>
    );
});

export default RollingNumber;
