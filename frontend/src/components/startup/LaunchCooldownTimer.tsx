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

  if (timeLeft <= 0) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-hover)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-md)',
        border: '0.5px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          backgroundColor: 'var(--accent-green)',
          color: 'white',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>✓</div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>LAUNCH AUTHORIZED</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-hover)',
      padding: '20px 24px',
      borderRadius: 'var(--radius-md)',
      border: '0.5px solid var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      animation: 'fadeIn 0.5s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--text-primary)',
        color: 'var(--bg-card)',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Timer size={24} weight="bold" />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
          NEXT LAUNCH AVAILABLE IN
        </h4>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", "Roboto Mono", monospace' }}>{days}d</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", "Roboto Mono", monospace' }}>{hours}h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", "Roboto Mono", monospace' }}>{minutes}m</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", "Roboto Mono", monospace' }}>{seconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
