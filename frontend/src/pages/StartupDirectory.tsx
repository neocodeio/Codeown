import React, { useState, useEffect, useMemo } from 'react';
import { StartupCard } from '../components/StartupCard.tsx';
import type { Startup } from '../types/startup.ts';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { MagnifyingGlass, Funnel, Plus, Rocket } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { getStartups, getCooldownStatus, type CooldownStatus } from '../api/startups.ts';
import { toast } from 'react-toastify';
import { LaunchCooldownTimer } from '../components/startup/LaunchCooldownTimer.tsx';
import { useClerkUser } from '../hooks/useClerkUser.ts';

export const StartupDirectory: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Built' | 'Paused' | 'Most Upvoted'>('All');
  const [cooldown, setCooldown] = useState<CooldownStatus | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { isSignedIn } = useClerkUser();

  useEffect(() => {
    const fetchStartups = async () => {
      setLoading(true);
      try {
        const data = await getStartups(searchQuery, filterStatus);
        if (Array.isArray(data)) {
          setStartups(data);
        } else {
          setStartups([]);
        }
      } catch (err) {
        toast.error("Failed to load startups.");
        setStartups([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchStartups, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    if (isSignedIn) {
      getCooldownStatus().then(setCooldown).catch(() => { });
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
    <div className="container" style={{ padding: isMobile ? '40px 20px' : '80px 40px', maxWidth: 'var(--max-width)' }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '32px' : '32px',
        marginBottom: isMobile ? '40px' : '60px'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Startup Directory</h1>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5, maxWidth: '600px' }}>
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

        <div style={{ display: 'flex', gap: '8px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '8px' : '0' }}>
          {['All', 'Active', 'Built', 'Paused', 'Most Upvoted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              style={{
                padding: '10px 18px',
                backgroundColor: filterStatus === status ? 'var(--bg-card)' : 'transparent',
                border: filterStatus === status ? '0.5px solid var(--text-secondary)' : '0.5px solid var(--border-hairline)',
                color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              {status.toUpperCase()}
            </button>
          ))}

          <div style={{ borderLeft: '1px solid var(--border-hairline)', margin: '0 8px' }} />
          <button style={{ backgroundColor: 'transparent', border: '0.5px solid var(--border-hairline)', color: 'var(--text-tertiary)', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Funnel size={18} />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>FETCHING STARTUPS...</p>
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
