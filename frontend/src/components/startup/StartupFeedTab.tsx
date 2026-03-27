import React, { useState, useEffect } from 'react';
import type { Startup, StartupUpdate } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Megaphone, Globe, PaperPlaneTilt, Clock, Rss } from 'phosphor-react';
import { toast } from 'react-toastify';
import ContentRenderer from '../ContentRenderer.tsx';
import { getStartupUpdates, postStartupUpdate } from '../../api/startups.ts';

interface StartupFeedTabProps {
  startup: Startup;
  isOwner: boolean;
}

export const StartupFeedTab: React.FC<StartupFeedTabProps> = ({ startup, isOwner }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const [updates, setUpdates] = useState<StartupUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState('');
  const [shouldBroadcast, setShouldBroadcast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const data = await getStartupUpdates(startup.id);
        setUpdates(data);
      } catch (err) {
        toast.error("Failed to load startup feed.");
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
  }, [startup.id]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setIsSubmitting(true);
    try {
        const posted = await postStartupUpdate(startup.id, newUpdate, shouldBroadcast);
        setUpdates([posted, ...updates]);
        setNewUpdate('');
        setShouldBroadcast(false);
        toast.success(shouldBroadcast ? "Update broadcasted to main feed!" : "Update posted to startup feed.");
    } catch (err) {
        toast.error("Failed to post update.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 'var(--feed-width)', margin: '0 auto' }}>
      {isOwner && (
          <div style={{ 
              marginBottom: '40px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? '24px 20px' : '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
          }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Megaphone size={18} weight="fill" color="var(--text-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Post Startup Update</span>
              </div>
              
              <form onSubmit={handlePostUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <textarea
                    placeholder={`What's the latest with ${startup.name}?`}
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    rows={isMobile ? 3 : 4}
                    style={{ backgroundColor: 'var(--bg-hover)', border: '0.5px solid var(--border-hairline)', fontSize: '14px' }}
                  />
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: isMobile ? '16px' : '12px'
                  }}>
                      <div 
                        onClick={() => setShouldBroadcast(!shouldBroadcast)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          cursor: 'pointer',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: shouldBroadcast ? 'var(--bg-hover)' : 'transparent',
                          border: shouldBroadcast ? '1px solid var(--text-primary)' : '1px solid var(--border-hairline)',
                          transition: 'all 0.2s ease',
                          flex: 1
                        }}
                      >
                          {/* <Broadcast size={20} weight={shouldBroadcast ? "fill" : "regular"} color={shouldBroadcast ? "var(--text-primary)" : "var(--text-tertiary)"} /> */}
                          {/* <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: shouldBroadcast ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Broadcast to main feed</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Visible to the whole community</div>
                          </div> */}
                      </div>

                      <button 
                        type="submit" 
                        className="primary"
                        disabled={!newUpdate.trim() || isSubmitting}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 24px', fontWeight: 800 }}
                      >
                          {isSubmitting ? 'POSTING...' : (
                              <>
                                <PaperPlaneTilt size={18} weight="bold" />
                                UPDATE
                              </>
                          )}
                      </button>
                  </div>
              </form>
          </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
                  <div style={{ width: '32px', height: '32px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>TAPPING INTO FEED...</p>
              </div>
          ) : updates.length > 0 ? (
              updates.map(update => (
                  <div key={update.id} style={{
                    position: 'relative',
                    padding: isMobile ? '24px 20px' : '32px',
                    backgroundColor: 'var(--bg-card)',
                    border: '0.5px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                      {update.is_broadcast && (
                          <div style={{ 
                              position: isMobile ? 'static' : 'absolute', 
                              top: '16px', 
                              right: '24px', 
                              alignSelf: isMobile ? 'flex-start' : 'auto',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              padding: '4px 10px',
                              backgroundColor: 'var(--bg-hover)',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '10px',
                              fontWeight: 800,
                              color: 'var(--text-tertiary)',
                              border: '0.5px solid var(--border-hairline)',
                              marginBottom: isMobile ? '8px' : '0'
                          }}>
                              <Globe size={14} />
                              BROADCASTED
                          </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 700 }}>
                          <Clock size={15} />
                          {new Date(update.created_at).toLocaleDateString()} • {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                          <ContentRenderer content={update.content} />
                      </div>
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border-hairline)' }}>
                  <Rss size={48} weight="thin" style={{ marginBottom: '16px' }} />
                  <p>No startup updates yet.</p>
              </div>
          )}
      </div>
    </div>
  );
};
