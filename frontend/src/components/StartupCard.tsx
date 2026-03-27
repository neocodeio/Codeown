import React from 'react';
import { Link } from 'react-router-dom';
import type { Startup } from '../types/startup';
import { Rocket, Users, Briefcase } from 'phosphor-react';

interface StartupCardProps {
  startup: Startup;
}

export const StartupCard: React.FC<StartupCardProps> = ({ startup }) => {
  return (
    <Link to={`/startup/${startup.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        backgroundColor: 'var(--bg-hover)',
        border: '0.5px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        padding: '32px',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        height: '100%',
        animation: 'fadeIn 0.4s ease'
      }}
      className="startup-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-page)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '0.5px solid var(--border-hairline)'
          }}>
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Rocket size={24} weight="thin" color="var(--text-tertiary)" />
            )}
          </div>
          
          <div style={{
            padding: '4px 8px',
            backgroundColor: 'var(--text-primary)',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 900,
            color: 'var(--bg-page)',
            letterSpacing: '0.05em'
          }}>
            {startup.status.toUpperCase()}
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 800,
            marginBottom: '10px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}>
            {startup.name}
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '44px'
          }}>
            {startup.tagline}
          </p>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '0.5px solid var(--border-hairline)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              @{startup.user?.username || 'builder'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            {startup.is_hiring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <Briefcase size={14} weight="bold" />
                <span style={{ fontSize: '10px', fontWeight: 900 }}>JOBS</span>
              </div>
            )}
            {startup.looking_for_cofounder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <Users size={14} weight="fill" />
                <span style={{ fontSize: '10px', fontWeight: 900 }}>PARTNERS</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .startup-card:hover {
            border-color: var(--text-primary);
            background-color: var(--bg-hover) !important;
            transform: translateY(-4px);
          }
        `}</style>
      </div>
    </Link>
  );
};
