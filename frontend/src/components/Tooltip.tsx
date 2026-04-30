import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export default function Tooltip({ text, children, position = 'top', delay = 1000 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timer, setTimer] = useState<any>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const targetRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
            });
            const t = setTimeout(() => {
                setIsVisible(true);
            }, delay);
            setTimer(t);
        }
    };

    const handleMouseLeave = () => {
        if (timer) clearTimeout(timer);
        setIsVisible(false);
    };

    const getTooltipStyles = () => {
        const offset = 8;
        const rect = targetRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
        
        const styles: React.CSSProperties = {
            position: 'absolute',
            backgroundColor: 'rgba(15, 20, 25, 0.95)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '18px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 999999,
            pointerEvents: 'none',
            opacity: isVisible ? 1 : 0,
            visibility: isVisible ? 'visible' : 'hidden',
            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
        };

        switch (position) {
            case 'top':
                styles.top = coords.top - offset;
                styles.left = coords.left + rect.width / 2;
                styles.transform = isVisible 
                    ? 'translate(-50%, -100%) translateY(0)' 
                    : 'translate(-50%, -100%) translateY(4px)';
                break;
            case 'bottom':
                styles.top = coords.top + rect.height + offset;
                styles.left = coords.left + rect.width / 2;
                styles.transform = isVisible 
                    ? 'translate(-50%, 0) translateY(0)' 
                    : 'translate(-50%, 0) translateY(-4px)';
                break;
            case 'left':
                styles.top = coords.top + rect.height / 2;
                styles.left = coords.left - offset;
                styles.transform = isVisible 
                    ? 'translate(-100%, -50%) translateX(0)' 
                    : 'translate(-100%, -50%) translateX(4px)';
                break;
            case 'right':
                styles.top = coords.top + rect.height / 2;
                styles.left = coords.left + rect.width + offset;
                styles.transform = isVisible 
                    ? 'translate(0, -50%) translateX(0)' 
                    : 'translate(0, -50%) translateX(-4px)';
                break;
        }

        return styles;
    };

    return (
        <>
            <div 
                ref={targetRef}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {createPortal(
                <div style={getTooltipStyles()}>
                    {text}
                </div>,
                document.body
            )}
        </>
    );
}
