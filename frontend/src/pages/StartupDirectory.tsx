import React, { useState, useMemo } from 'react';
import { StartupCard } from '../components/StartupCard.tsx';
import type { Startup } from '../types/startup';
import { useWindowSize } from '../hooks/useWindowSize';
import { MagnifyingGlass, Funnel, Plus } from 'phosphor-react';
import { Link } from 'react-router-dom';

export const StartupDirectory: React.FC = () => {
  const [startups] = useState<Startup[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Built' | 'Paused'>('All');
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const filteredStartups = useMemo(() => {
    return startups.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [startups, searchQuery, filterStatus]);

  return (
    <div className="container" style={{ padding: isMobile ? '40px 20px' : '80px 40px', maxWidth: 'var(--max-width)' }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '32px' : '20px',
        marginBottom: isMobile ? '40px' : '60px'
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Startup Directory</h1>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5 }}>
            Discover and connect with the next generation of technology builders.
          </p>
        </div>
        
        <Link to="/startup/new" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
          <button className="primary" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            fontWeight: 800,
            width: isMobile ? '100%' : 'auto',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Plus size={20} weight="bold" />
            Launch Startup
          </button>
        </Link>
      </div>

      {/* Discovery UI Bar */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '32px' : '40px',
        padding: isMobile ? '16px' : '20px',
        backgroundColor: 'var(--bg-card)',
        border: '0.5px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ position: 'relative', width: '100%', flex: isMobile ? 'none' : 1 }}>
          <MagnifyingGlass size={20} weight="thin" color="var(--text-tertiary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
                width: '100%',
                padding: '14px 14px 14px 48px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-hover)',
                border: '0.5px solid var(--border-hairline)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0' }}>
          {!isMobile && <Funnel size={18} weight="bold" color="var(--text-tertiary)" />}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '4px', border: '0.5px solid var(--border-hairline)', width: isMobile ? '100%' : 'auto' }}>
            {['All', 'Active', 'Built', 'Paused'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '8px 12px' : '8px 16px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: filterStatus === status ? 'var(--bg-card)' : 'transparent',
                  color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredStartups.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '320px'}, 1fr))`,
          gap: isMobile ? '16px' : '24px'
        }}>
          {filteredStartups.map(s => (
            <StartupCard key={s.id} startup={s} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: isMobile ? '80px 20px' : '120px 40px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '0.5px solid var(--border-hairline)'
        }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>No startups found</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Try adjusting your search query or filters.</p>
        </div>
      )}
    </div>
  );
};
