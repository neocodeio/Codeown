import React, { useState, useEffect } from 'react';
import { Timer } from 'phosphor-react';

interface Props {
  diffMs: number;
}

export const LaunchCooldownTimer: React.FC<Props> = ({ diffMs }) => {
  const [timeLeft, setTimeLeft] = useState(diffMs);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (timeLeft <= 0) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      backgroundColor: 'var(--bg-hover)',
      borderRadius: 'var(--radius-xl)',
      border: '0.5px solid var(--border-hairline)',
      animation: 'fadeIn 0.4s ease'
    }}>
      <Timer size={16} weight="bold" color="var(--text-tertiary)" />
      <div style={{ 
          display: 'flex', 
          gap: '8px', 
          fontSize: '11px', 
          fontWeight: 700, 
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          letterSpacing: '0.02em'
      }}>
        <span style={{ color: 'var(--text-primary)' }}>LAUNCH COOLDOWN:</span>
        <span>{days}D {hours}H {minutes}M {seconds}S</span>
      </div>
    </div>
  );
};
