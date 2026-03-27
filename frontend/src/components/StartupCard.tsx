import React from 'react';
import { Link } from 'react-router-dom';
import type { Startup } from '../types/startup';
import { Rocket, Users, Briefcase, MinusCircle, CheckCircle } from 'phosphor-react';

interface StartupCardProps {
  startup: Startup;
}

export const StartupCard: React.FC<StartupCardProps> = ({ startup }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Rocket size={14} weight="fill" color="#10b981" />;
      case 'Built': return <CheckCircle size={14} weight="fill" color="var(--text-primary)" />;
      case 'Paused': return <MinusCircle size={14} weight="fill" color="var(--text-tertiary)" />;
      default: return null;
    }
  };

  return (
    <Link to={`/startup/${startup.id}`} className="startup-card-link">
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '0.5px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        transition: 'all 0.2s var(--ease-smooth)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
        className="startup-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-hover)',
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--bg-hover)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            border: '0.5px solid var(--border-hairline)'
          }}>
            {getStatusIcon(startup.status)}
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{startup.status}</span>
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '6px',
            color: 'var(--text-primary)'
          }}>
            {startup.name}
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '42px'
          }}>
            {startup.tagline}
          </p>
        </div>

        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '0.5px solid var(--border-hairline)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>by</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>@{startup.user?.username || startup.owner_id}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {startup.is_hiring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }} title="Hiring">
                <Briefcase size={16} weight="bold" />
                <span style={{ fontSize: '11px', fontWeight: 700 }}>HIRING</span>
              </div>
            )}
            {startup.looking_for_cofounder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }} title="Looking for Co-founder">
                <Users size={16} weight="bold" />
              </div>
            )}
          </div>
        </div>

        <style>{`
          .startup-card:hover {
            border-color: var(--text-secondary);
            transform: translateY(-2px);
            background-color: var(--bg-hover) !important;
          }
          .startup-card-link {
            text-decoration: none;
            color: inherit;
          }
        `}</style>
      </div>
    </Link>
  );
};
