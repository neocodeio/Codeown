import React, { useState } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export default function Tooltip({ text, children, position = 'top', delay = 1000 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timer, setTimer] = useState<any>(null);

    const handleMouseEnter = () => {
        const t = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimer(t);
    };

    const handleMouseLeave = () => {
        if (timer) clearTimeout(timer);
        setIsVisible(false);
    };

    const getPositionStyles = () => {
        const offset = '6px';
        switch (position) {
            case 'top':
                return {
                    bottom: `calc(100% + ${offset})`,
                    left: '50%',
                    transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(2px)',
                };
            case 'bottom':
                return {
                    top: `calc(100% + ${offset})`,
                    left: '50%',
                    transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-2px)',
                };
            case 'left':
                return {
                    right: `calc(100% + ${offset})`,
                    top: '50%',
                    transform: isVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(2px)',
                };
            case 'right':
                return {
                    left: `calc(100% + ${offset})`,
                    top: '50%',
                    transform: isVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-2px)',
                };
            default:
                return {};
        }
    };

    return (
        <div 
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <div
                style={{
                    position: 'absolute',
                    backgroundColor: 'rgba(15, 20, 25, 0.95)',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: '18px',
                    fontSize: '11px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    opacity: isVisible ? 1 : 0,
                    visibility: isVisible ? 'visible' : 'hidden',
                    transition: 'all 0.1s ease-out',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)',
                    ...getPositionStyles(),
                }}
            >
                {text}
            </div>
        </div>
    );
}
