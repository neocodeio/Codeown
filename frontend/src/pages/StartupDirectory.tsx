import React, { useState, useEffect, useMemo } from 'react';
import { StartupCard } from '../components/StartupCard.tsx';
import type { Startup } from '../types/startup.ts';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { MagnifyingGlass, Rocket } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { getStartups, getCooldownStatus, type CooldownStatus } from '../api/startups.ts';
import { toast } from 'react-toastify';
import { LaunchCooldownTimer } from '../components/startup/LaunchCooldownTimer.tsx';
import { useClerkUser } from '../hooks/useClerkUser.ts';

export const StartupDirectory: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Built' | 'Paused'>('All');
  const [cooldown, setCooldown] = useState<CooldownStatus | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { isSignedIn } = useClerkUser();

  useEffect(() => {
    const fetchStartups = async () => {
      setLoading(true);
      try {
        const data = await getStartups(searchQuery, filterStatus);
        setStartups(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Failed to load startups.");
        setStartups([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchStartups, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    if (isSignedIn) {
        getCooldownStatus().then(setCooldown).catch(() => {});
    }
  }, [isSignedIn]);

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
    <div style={{ padding: isMobile ? '48px 20px' : '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: '40px',
        marginBottom: '80px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Rocket size={20} weight="fill" color="var(--text-primary)" />
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Ecosystem Explorer</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>The Startup Directory</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6, maxWidth: '520px' }}>
            Discover the next generation of technology units built by the community.
          </p>
        </div>
        
        {cooldown?.isInCooldown && cooldown.diffMs ? (
            <LaunchCooldownTimer diffMs={cooldown.diffMs} />
        ) : (
            <Link to="/startup/new" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                <button className="primary" style={{ padding: '14px 32px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>LAUNCH STARTUP</button>
            </Link>
        )}
      </header>

      {/* Discovery Toolset */}
      <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '24px',
          alignItems: 'center',
          marginBottom: '64px',
          paddingBottom: '32px',
          borderBottom: '0.5px solid var(--border-hairline)'
      }}>
        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
          <MagnifyingGlass size={18} weight="thin" color="var(--text-tertiary)" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
                width: '100%',
                padding: '12px 0 12px 32px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '15px',
                color: 'var(--text-primary)',
                outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: isMobile ? 'auto' : 'visible', width: isMobile ? '100%' : 'auto' }}>
            {['All', 'Active', 'Built', 'Paused'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: filterStatus === status ? 'var(--text-primary)' : 'transparent',
                        border: '0.5px solid var(--border-hairline)',
                        color: filterStatus === status ? 'var(--bg-card)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                    }}
                >
                    {status.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
      ) : filteredStartups.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: '40px' 
        }}>
          {filteredStartups.map(startup => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em' }}>NO MATCHES FOUND</p>
        </div>
      )}
    </div>
  );
};
