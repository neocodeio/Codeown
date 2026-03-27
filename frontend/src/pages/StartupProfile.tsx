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
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'members', label: 'Team', icon: Users },
    { id: 'jobs', label: 'Roles', icon: Briefcase },
    { id: 'feed', label: 'Updates', icon: Rss },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!startup) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <Warning size={32} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>UNABLE TO LOCATE UNIT</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '13px' }}>The requested startup record does not exist or has been archived.</p>
          <button className="primary" onClick={() => navigate('/startups')} style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800 }}>RETURN TO INDEX</button>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '32px 20px' : '64px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Refined Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '40px',
        marginBottom: '64px'
      }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{
            width: isMobile ? '72px' : '96px',
            height: isMobile ? '72px' : '96px',
            borderRadius: '12px',
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
              <Rocket size={40} weight="thin" color="var(--text-tertiary)" />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{startup.name}</h1>
              <span style={{
                padding: '4px 8px',
                backgroundColor: 'var(--text-primary)',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 900,
                color: 'var(--bg-page)',
                letterSpacing: '0.05em'
              }}>
                 {startup.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: isMobile ? '15px' : '18px', color: 'var(--text-secondary)', fontWeight: 500 }}>{startup.tagline}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
           {startup.website_url && (
             <a href={startup.website_url} target="_blank" rel="noreferrer">
               <button style={{ 
                   height: '44px', 
                   width: '44px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   backgroundColor: 'transparent',
                   border: '0.5px solid var(--border-hairline)',
                   borderRadius: 'var(--radius-sm)',
                   color: 'var(--text-primary)'
               }}>
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
                 gap: '10px',
                 padding: '0 24px',
                 height: '44px',
                 fontWeight: 800,
                 fontSize: '11px',
                 backgroundColor: 'var(--bg-hover)',
                 border: '0.5px solid var(--border-hairline)',
                 borderRadius: 'var(--radius-sm)'
               }}
             >
               <PencilSimple size={14} weight="bold" />
               EDIT PROFILE
             </button>
           )}
        </div>
      </div>

      {/* Navigation Ribbons */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '20px' : '40px',
        marginBottom: '64px',
        borderBottom: '0.5px solid var(--border-hairline)',
        overflowX: isMobile ? 'auto' : 'visible'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '16px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: 800,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Workspace */}
      <div style={{ animation: 'fadeIn 0.4s ease forwards' }}>
        {activeTab === 'overview' && <StartupOverview startup={startup} isOwner={isOwner} onUpdate={fetchStartup} />}
        {activeTab === 'members' && <StartupMembers startup={startup} isOwner={isOwner} onUpdate={fetchStartup} />}
        {activeTab === 'jobs' && <StartupJobsTab startup={startup} isOwner={isOwner} />}
        {activeTab === 'feed' && <StartupFeedTab startup={startup} isOwner={isOwner} />}
      </div>
    </div>
  );
};
