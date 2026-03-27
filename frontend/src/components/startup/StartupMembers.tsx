import React, { useState, useEffect } from 'react';
import type { Startup, StartupMember } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Trash, Shield, Users, MagnifyingGlass } from 'phosphor-react';
import { toast } from 'react-toastify';
import { getStartupMembers, addStartupMember, removeStartupMember } from '../../api/startups.ts';

interface StartupMembersProps {
  startup: Startup;
  isOwner: boolean;
  onUpdate?: () => void;
}

export const StartupMembers: React.FC<StartupMembersProps> = ({ startup, isOwner, onUpdate }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const [members, setMembers] = useState<StartupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getStartupMembers(startup.id);
      if (Array.isArray(data)) {
        setMembers(data.map(m => ({
          user_id: m.user.id,
          name: m.user.name,
          username: m.user.username,
          avatar_url: m.user.avatar_url,
          role: m.role as any
        })));
      } else {
        setMembers([]);
      }
    } catch (err) {
      toast.error("Failed to load team members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [startup.id]);

  const handleRemoveMember = async (userId: string) => {
    if (userId === startup.owner_id) {
        toast.error("Cannot remove the owner.");
        return;
    }
    
    try {
        await removeStartupMember(startup.id, userId);
        toast.success("Member removed.");
        fetchMembers();
        if (onUpdate) onUpdate();
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to remove member.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
        await addStartupMember(startup.id, searchQuery.trim());
        toast.success(`Sent invite to @${searchQuery.trim()}`);
        setSearchQuery('');
        fetchMembers();
        if (onUpdate) onUpdate();
    } catch (err: any) {
        toast.error(err.response?.data?.error || "User not found or already on team.");
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '0' : '20px 0' }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '0.5px solid var(--border-hairline)'
      }}>
          <h2 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Team Composition
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{members.length} / 50 UNITS</span>
      </div>

      {isOwner && (
          <form 
            onSubmit={handleAddMember}
            style={{ 
              marginBottom: '48px', 
              display: 'flex', 
              gap: '12px',
              backgroundColor: 'var(--bg-hover)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '0.5px solid var(--border-hairline)'
            }}
          >
              <div style={{ flex: 1, position: 'relative' }}>
                  <MagnifyingGlass size={16} weight="thin" color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Invite by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        paddingLeft: '40px', 
                        backgroundColor: 'transparent', 
                        border: 'none',
                        fontSize: '14px'
                    }}
                  />
              </div>
              <button className="primary" style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 800 }}>INVITE</button>
          </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                  <div style={{ width: '20px', height: '20px', border: '1.5px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
          ) : (Array.isArray(members) && members.length > 0) ? (
              members.map(member => (
                  <div key={member.user_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: '0.5px solid var(--border-hairline)',
                      animation: 'fadeIn 0.4s ease'
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-hover)',
                              border: '0.5px solid var(--border-hairline)',
                              overflow: 'hidden',
                              flexShrink: 0
                          }}>
                              {member.avatar_url ? (
                                  <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Users size={16} weight="thin" color="var(--text-tertiary)" />
                                  </div>
                              )}
                          </div>
                          <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</span>
                                  {member.role === 'Owner' && <Shield size={12} weight="fill" color="var(--text-tertiary)" />}
                                  <span style={{ 
                                      fontSize: '9px', 
                                      fontWeight: 900, 
                                      color: 'var(--text-tertiary)', 
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      backgroundColor: 'var(--bg-hover)',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                  }}>{member.role}</span>
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>@{member.username}</span>
                          </div>
                      </div>

                      {isOwner && member.role !== 'Owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            style={{
                              padding: '8px',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              opacity: 0.4,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                          >
                             <Trash size={16} weight="thin" />
                          </button>
                      )}
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>NO MEMBERS REGISTERED</p>
              </div>
          )}
      </div>
    </div>
  );
};
