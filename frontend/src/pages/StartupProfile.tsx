import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Startup } from '../types/startup.ts';
import { useClerkUser } from '../hooks/useClerkUser.ts';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { StartupOverview } from "../components/startup/StartupOverview.tsx";
import { StartupMembers } from "../components/startup/StartupMembers.tsx";
import { StartupJobsTab } from "../components/startup/StartupJobsTab.tsx";
import { StartupFeedTab } from "../components/startup/StartupFeedTab.tsx";
import { getStartup } from '../api/startups.ts';
import { toast } from 'react-toastify';
import {
  Layout,
  Users,
  Briefcase,
  Rss,
  Globe,
  PencilSimple,
  Rocket,
  Warning
} from 'phosphor-react';

import { SEO } from '../components/SEO.tsx';

export const StartupProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'jobs' | 'feed'>('overview');

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStartup = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getStartup(id);
      setStartup(data);
    } catch (err) {
      toast.error("Startup not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartup();
  }, [id]);

  const isOwner = currentUser?.id === startup?.owner_id;

  const tabs = [
    { id: 'overview', label: isMobile ? '' : 'Overview', icon: Layout },
    { id: 'members', label: isMobile ? '' : 'Members', icon: Users },
    { id: 'jobs', label: isMobile ? '' : 'Jobs', icon: Briefcase },
    { id: 'feed', label: isMobile ? '' : 'Feed', icon: Rss },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!startup) {
    return (
      <div style={{ padding: isMobile ? '60px 20px' : '100px 40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <SEO title="Startup Not Found" description="The requested startup profile could not be found on Codeown." />
        <Warning size={48} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Startup Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>This startup might have been removed or the link is incorrect.</p>
        <button className="primary" onClick={() => navigate('/startups')}>RETURN TO DIRECTORY</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: isMobile ? '20px' : '60px 40px', maxWidth: 'var(--max-width)' }}>
      <SEO
        title={startup.name}
        description={startup.tagline}
        image={startup.logo_url || undefined}
      />
      {/* Profile Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: isMobile ? '32px 24px' : '60px 40px',
        borderRadius: 'var(--radius-lg)',
        border: '0.5px solid var(--border-hairline)',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '24px' : '20px'
        }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '24px', alignItems: isMobile ? 'flex-start' : 'center' }}>
            <div style={{
              width: isMobile ? '64px' : '80px',
              height: isMobile ? '64px' : '80px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-hover)',
              border: '0.5px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {startup.logo_url ? (
                <img src={startup.logo_url} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Rocket size={isMobile ? 32 : 40} weight="thin" color="var(--text-tertiary)" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{startup.name}</h1>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {startup.status.toUpperCase()}
                </div>
              </div>
              <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)' }}>{startup.tagline}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
            {startup.website_url && (
              <a href={startup.website_url} target="_blank" rel="noreferrer" style={{ flex: isMobile ? 1 : 'none' }}>
                <button style={{ color: 'var(--text-secondary)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Globe size={18} />
                </button>
              </a>
            )}

            {isOwner && (
              <button
                onClick={() => navigate(`/startup/${startup.id}/edit`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  flex: isMobile ? 2 : 'none'
                }}
              >
                <PencilSimple size={16} />
                {isMobile ? 'Edit' : 'Edit Startup'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '0.5px solid var(--border-hairline)',
        marginBottom: '32px',
        width: isMobile ? '100%' : 'max-content',
        overflowX: isMobile ? 'auto' : 'visible'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '12px' : '12px 24px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              minWidth: isMobile ? '60px' : 'auto'
            }}
          >
            <tab.icon size={20} weight={activeTab === tab.id ? 'fill' : 'regular'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ animation: 'fadeIn 0.4s ease forwards' }}>
        {activeTab === 'overview' && <StartupOverview startup={startup} isOwner={isOwner} onUpdate={fetchStartup} />}
        {activeTab === 'members' && <StartupMembers startup={startup} isOwner={isOwner} onUpdate={fetchStartup} />}
        {activeTab === 'jobs' && <StartupJobsTab startup={startup} isOwner={isOwner} />}
        {activeTab === 'feed' && <StartupFeedTab startup={startup} isOwner={isOwner} />}
      </div>
    </div>
  );
};
