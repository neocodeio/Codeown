import React, { useState, useEffect } from 'react';
import type { Startup, StartupUpdate } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Globe } from 'phosphor-react';
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
        toast.success(shouldBroadcast ? "Update broadcasted!" : "Update posted.");
    } catch (err) {
        toast.error("Failed to post update.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '0' : '20px 0' }}>
      {isOwner && (
          <div style={{ 
              marginBottom: '64px',
              backgroundColor: 'var(--bg-hover)',
              border: '0.5px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'fadeIn 0.4s ease'
          }}>
              <form onSubmit={handlePostUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <textarea
                    placeholder={`Broadcast an update for ${startup.name}...`}
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    rows={3}
                    style={{ 
                        backgroundColor: 'transparent', 
                        border: 'none', 
                        fontSize: '15px',
                        padding: '0',
                        resize: 'none'
                    }}
                  />
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '0.5px solid var(--border-hairline)'
                  }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: shouldBroadcast ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                          <input 
                            type="checkbox" 
                            checked={shouldBroadcast} 
                            onChange={(e) => setShouldBroadcast(e.target.checked)}
                            style={{ width: '14px', height: '14px', accentColor: 'var(--text-primary)' }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             Broadcast to main feed
                          </span>
                      </label>

                      <button 
                        type="submit" 
                        className="primary"
                        disabled={!newUpdate.trim() || isSubmitting}
                        style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 800 }}
                      >
                         {isSubmitting ? '...' : 'POST UPDATE'}
                      </button>
                  </div>
              </form>
          </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Vertical Timeline line */}
          {updates.length > 1 && (
              <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '0.5px', backgroundColor: 'var(--border-hairline)' }} />
          )}

          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                  <div style={{ width: '20px', height: '20px', border: '1.5px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
          ) : updates.length > 0 ? (
              updates.map(update => (
                  <div key={update.id} style={{
                    position: 'relative',
                    padding: '0 0 48px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.4s ease'
                  }}>
                      {/* Timeline Dot */}
                      <div style={{ 
                          position: 'absolute', 
                          left: '6px', 
                          top: '6px', 
                          width: '11px', 
                          height: '11px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--bg-page)', 
                          border: '2px solid var(--text-primary)',
                          zIndex: 1
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                              {new Date(update.created_at).toLocaleDateString()} • {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {update.is_broadcast && (
                              <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  padding: '2px 6px',
                                  backgroundColor: 'var(--bg-hover)',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  color: 'var(--text-tertiary)',
                                  border: '0.5px solid var(--border-hairline)',
                                  letterSpacing: '0.05em'
                              }}>
                                  <Globe size={11} />
                                  BROADCAST
                              </div>
                          )}
                      </div>

                      <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                          <ContentRenderer content={update.content} />
                      </div>
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>NO UPDATES LOGGED</p>
              </div>
          )}
      </div>
    </div>
  );
};
;
