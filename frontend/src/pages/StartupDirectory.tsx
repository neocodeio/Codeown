import React, { useState, useMemo } from 'react';
import { StartupCard } from '../components/StartupCard.tsx';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { MagnifyingGlass, Plus, Rocket } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { getStartups, getCooldownStatus } from '../api/startups.ts';
import { LaunchCooldownTimer } from '../components/startup/LaunchCooldownTimer.tsx';
import { useClerkUser } from '../hooks/useClerkUser.ts';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import { SEO } from '../components/SEO';
import { StartupCardSkeleton } from '../components/LoadingSkeleton';

export const StartupDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Built' | 'Paused' | 'Most Upvoted'>('All');
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { isSignedIn } = useClerkUser();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: startups = [], isLoading: loading } = useQuery({
    queryKey: ['startups', debouncedSearch, filterStatus],
    queryFn: async () => {
      const data = await getStartups(debouncedSearch, filterStatus);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: cooldown = null } = useQuery({
    queryKey: ['startupCooldown', isSignedIn],
    queryFn: async () => {
      if (!isSignedIn) return null;
      return await getCooldownStatus();
    },
    enabled: isSignedIn,
    staleTime: 60 * 1000,
  });

  const filteredStartups = useMemo(() => {
    if (!Array.isArray(startups)) return [];
    return startups.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tagline || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [startups, searchQuery, filterStatus]);

  return (
    <div className="container" style={{
      padding: isMobile ? '24px 16px' : '80px 40px',
      maxWidth: 'var(--max-width)',
      backgroundColor: 'var(--bg-page)',
      minHeight: '100vh'
    }}>
      <SEO title="Startups" description="Discover and connect with the next generation of technology builders on Codeown." />
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '20px' : '32px',
        marginBottom: isMobile ? '24px' : '60px'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Startup Directory</h1>
          <p style={{ fontSize: isMobile ? '13px' : '16px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6, maxWidth: '600px' }}>
            Discover and connect with the next generation of technology builders.
          </p>
        </div>

        {cooldown?.isInCooldown && cooldown.diffMs ? (
          <LaunchCooldownTimer diffMs={cooldown.diffMs} />
        ) : (
          <Link to="/startup/new" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
            <button className="primary" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px 32px',
              fontWeight: 800,
              width: isMobile ? '100%' : 'auto',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Plus size={20} weight="bold" />
              Launch Startup
            </button>
          </Link>
        )}
      </div>

      {/* Discovery UI Bar */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '12px' : '20px',
        marginBottom: isMobile ? '24px' : '40px',
        padding: isMobile ? '0' : '20px',
        backgroundColor: isMobile ? 'transparent' : 'var(--bg-card)',
        border: isMobile ? 'none' : '0.5px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ position: 'relative', width: '100%', flex: isMobile ? 'none' : 1 }} className="search-container">
          <MagnifyingGlass size={20} weight="thin" color="var(--text-tertiary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} className="search-icon" />
          <input
            type="text"
            placeholder="Search startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '14px 16px 14px 48px' : '16px 16px 16px 52px',
              borderRadius: isMobile ? '14px' : 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '0.5px solid var(--border-hairline)',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--text-primary)';
              e.target.style.backgroundColor = 'var(--bg-hover)';
              const icon = e.target.previousSibling as HTMLElement;
              if (icon) icon.style.color = 'var(--text-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-hairline)';
              e.target.style.backgroundColor = 'var(--bg-card)';
              const icon = e.target.previousSibling as HTMLElement;
              if (icon) icon.style.color = 'var(--text-tertiary)';
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          width: isMobile ? 'calc(100% + 32px)' : 'auto',
          marginLeft: isMobile ? '-16px' : '0',
          marginRight: isMobile ? '-16px' : '0',
          overflowX: 'auto',
          padding: isMobile ? '0 16px 4px 16px' : '0',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {['All', 'Active', 'Built', 'Paused', 'Most Upvoted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 18px',
                backgroundColor: filterStatus === status ? 'var(--text-primary)' : 'var(--bg-card)',
                border: '0.5px solid var(--border-hairline)',
                color: filterStatus === status ? 'var(--bg-card)' : 'var(--text-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {status.toUpperCase()}
            </button>
          ))}

          {isMobile && <div style={{ minWidth: '16px', height: '1px' }} />}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {[...Array(6)].map((_, i) => (
            <StartupCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredStartups.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredStartups.map(startup => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Rocket size={48} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: '24px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>No Startups Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Be the first to launch a startup in this category!</p>
        </div>
      )}
    </div>
  );
};
