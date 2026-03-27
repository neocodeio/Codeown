import React from 'react';
import type { Startup } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import ContentRenderer from '../ContentRenderer.tsx';
import { Cpu, Calendar, Target } from 'phosphor-react';

interface StartupOverviewProps {
  startup: Startup;
}

export const StartupOverview: React.FC<StartupOverviewProps> = ({ startup }) => {
  const { width } = useWindowSize();
  const isMobile = width < 960;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      gap: isMobile ? '40px' : '32px' 
    }}>
      {/* Description Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', flex: isMobile ? 'none' : 2 }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '32px 24px' : '40px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>Vision & Pitch</h2>
          <ContentRenderer content={startup.description} />
        </div>

        {/* Milestone Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <Target size={24} color="var(--text-primary)" />
             Milestone Timeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
             <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border-hairline)' }} />
             
             {startup.milestones.length > 0 ? (
               startup.milestones.map((m) => (
                 <div key={m.id} style={{ display: 'flex', gap: isMobile ? '16px' : '24px', position: 'relative' }}>
                    <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-page)', 
                        border: '2px solid var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        flexShrink: 0
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '2px' : '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                {isMobile ? '' : '• '} {m.date}
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.description}</p>
                    </div>
                 </div>
               ))
             ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', fontStyle: 'italic' }}>No milestones recorded yet.</p>
             )}
          </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: isMobile ? 'none' : 1, minWidth: isMobile ? '100%' : '320px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '24px' : '32px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Cpu size={20} weight="thin" />
             Tech Stack
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {startup.tech_stack.map(tech => (
              <span key={tech} style={{ 
                  padding: '6px 14px', 
                  backgroundColor: 'var(--bg-hover)', 
                  border: '0.5px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '24px' : '32px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
           <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Calendar size={20} weight="thin" />
             Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Founded</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{startup.founded_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Members</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{startup.member_count} builders</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Created On</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{new Date(startup.created_at).toLocaleDateString()}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
