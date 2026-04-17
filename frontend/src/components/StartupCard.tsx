import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Startup } from '../types/startup';
import { Rocket, Users, Briefcase, MinusCircle, CheckCircle, CaretUp } from 'phosphor-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { upvoteStartup } from '../api/startups';
import { toast } from 'react-toastify';
import { useClerkUser } from '../hooks/useClerkUser';
import { socket } from '../lib/socket.js';

interface StartupCardProps {
  startup: Startup;
  onUpvoteUpdated?: (id: string, count: number, hasUpvoted: boolean) => void;
}

export const StartupCard: React.FC<StartupCardProps> = ({ startup, onUpvoteUpdated }) => {
  const [upvotes, setUpvotes] = useState(startup.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(startup.has_upvoted || false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const { isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleContentUpdate = (payload: { type: string; data: any }) => {
      if (payload.type === 'startup_upvote' && payload.data.id === startup.id) {
        setUpvotes(payload.data.upvotes_count);
      }
    };

    socket.on('content_update', handleContentUpdate);

    return () => {
      socket.off('content_update', handleContentUpdate);
    };
  }, [startup.id]);


  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast.info("Please sign in to upvote startups.");
      return;
    }

    if (isUpvoting) return;

    // Optimistic Update
    const previousUpvotes = upvotes;
    const previousHasUpvoted = hasUpvoted;

    const newHasUpvoted = !previousHasUpvoted;
    const newUpvotes = newHasUpvoted ? previousUpvotes + 1 : Math.max(0, previousUpvotes - 1);

    setUpvotes(newUpvotes);
    setHasUpvoted(newHasUpvoted);
    setIsUpvoting(true);

    try {
      const response = await upvoteStartup(startup.id);
      // Sync with server response
      setUpvotes(response.upvotes_count);
      setHasUpvoted(response.has_upvoted);
      if (onUpvoteUpdated) {
        onUpvoteUpdated(startup.id, response.upvotes_count, response.has_upvoted);
      }
    } catch (err: any) {
      // Revert on error
      setUpvotes(previousUpvotes);
      setHasUpvoted(previousHasUpvoted);
      toast.error(err.response?.data?.error || "Failed to upvote.");
    } finally {
      setIsUpvoting(false);
    }
  };


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
        padding: isMobile ? '20px' : '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
        className="startup-card"
      >
        {/* Top Section */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '0.5px solid var(--border-hairline)',
            flexShrink: 0
          }}>
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Rocket size={32} weight="thin" color="var(--text-tertiary)" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2
              }}>
                {startup.name}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                backgroundColor: 'var(--bg-hover)',
                borderRadius: '6px',
                fontSize: '9px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                border: '0.5px solid var(--border-hairline)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {getStatusIcon(startup.status)}
                {startup.status}
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              height: '40px'
            }}>
              {startup.tagline}
            </p>
          </div>

          <button
            onClick={handleUpvote}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '48px',
              backgroundColor: hasUpvoted ? 'var(--text-primary)' : 'var(--bg-hover)',
              color: hasUpvoted ? 'var(--bg-card)' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '2px',
              flexShrink: 0
            }}
            className="upvote-btn"
          >
            <CaretUp size={16} weight="bold" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{upvotes}</span>
          </button>
        </div>

        {/* Bottom Metadata */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '0.5px solid var(--border-hairline)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>by</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>@{startup.user?.username || "founder"}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {startup.is_hiring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                <Briefcase size={14} weight="bold" />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em' }}>HIRING</span>
              </div>
            )}
            {startup.looking_for_cofounder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                <Users size={14} weight="bold" />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em' }}>PARTNERS</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .startup-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08);
            border-color: var(--text-secondary);
          }
          .startup-card-link {
            text-decoration: none;
            color: inherit;
          }
          .upvote-btn:hover {
            opacity: 0.9;
            transform: scale(1);
          }
        `}</style>
      </div>
    </Link>
  );
};

