import React, { useState, useEffect } from 'react';
import type { Startup, StartupMember } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { UserPlus, Trash, Shield, Users, MagnifyingGlass } from 'phosphor-react';
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
    <div style={{ maxWidth: 'var(--feed-width)', margin: '0 auto' }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0',
          marginBottom: '32px'
      }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={isMobile ? 24 : 28} color="var(--text-primary)" />
              Startup Team
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{members.length} contributors</span>
      </div>

      {isOwner && (
          <form 
            onSubmit={handleAddMember}
            style={{ 
              marginBottom: '40px', 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: '12px',
              padding: isMobile ? '20px' : '24px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)'
            }}
          >
              <div style={{ flex: 1, position: 'relative' }}>
                  <MagnifyingGlass size={18} weight="thin" color="var(--text-tertiary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '44px', backgroundColor: 'var(--bg-hover)', width: '100%' }}
                  />
              </div>
              <button className="primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800, padding: '12px 24px' }}>
                  <UserPlus size={18} weight="bold" />
                  INVITE
              </button>
          </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
                  <div style={{ width: '32px', height: '32px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>ASSEMBLING TEAM...</p>
              </div>
          ) : (Array.isArray(members) && members.length > 0) ? (
              members.map(member => (
                  <div key={member.user_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: isMobile ? '16px' : '20px',
                      backgroundColor: 'var(--bg-card)',
                      border: '0.5px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background-color 0.2s ease'
                  }}>
                      {/* ... rest of member item ... */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                          <div style={{
                              width: isMobile ? '36px' : '40px',
                              height: isMobile ? '36px' : '40px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-hover)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '0.5px solid var(--border-hairline)',
                              flexShrink: 0
                          }}>
                              {member.avatar_url ? (
                                  <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                              ) : (
                                  <Users size={isMobile ? 18 : 20} weight="thin" color="var(--text-tertiary)" />
                              )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</span>
                                  {member.role === 'Owner' && <div title="Startup Owner"><Shield size={13} weight="fill" color="#3b82f6" /></div>}
                                  <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 6px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-xs)', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{member.role.toUpperCase()}</span>
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>@{member.username}</span>
                          </div>
                      </div>

                      {isOwner && member.role !== 'Owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            style={{
                              padding: '8px',
                              border: 'none',
                              color: '#ef4444',
                              backgroundColor: 'transparent',
                              opacity: 0.6,
                              borderRadius: 'var(--radius-xs)',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                             <Trash size={18} weight="thin" />
                          </button>
                      )}
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-hairline)' }}>
                  <Users size={40} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No members found yet.</p>
              </div>
          )}
      </div>
    </div>
  );
};
