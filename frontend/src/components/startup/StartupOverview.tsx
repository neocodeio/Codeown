import React from 'react';
import type { Startup } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import ContentRenderer from '../ContentRenderer.tsx';
import { Cpu, Calendar, Target, Plus, Trash, X } from 'phosphor-react';
import { updateStartup } from '../../api/startups.ts';
import { toast } from 'react-toastify';

interface StartupOverviewProps {
  startup: Startup;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export const StartupOverview: React.FC<StartupOverviewProps> = ({ startup, isOwner, onUpdate }) => {
  const { width } = useWindowSize();
  const isMobile = width < 960;
  
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [milestoneForm, setMilestoneForm] = React.useState({ title: '', description: '', date: '' });

  const handleAddMilestone = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!milestoneForm.title || !milestoneForm.date) {
          toast.error("Please provide a title and date.");
          return;
      }

      setIsSubmitting(true);
      try {
          const newMilestone = {
              id: crypto.randomUUID(),
              ...milestoneForm
          };
          
          const updatedMilestones = [...(startup.milestones || []), newMilestone];
          await updateStartup(startup.id, { milestones: updatedMilestones });
          
          toast.success("Milestone added!");
          setIsMilestoneModalOpen(false);
          setMilestoneForm({ title: '', description: '', date: '' });
          if (onUpdate) onUpdate();
      } catch (err) {
          toast.error("Failed to add milestone.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
      if (!window.confirm("Remove this milestone?")) return;
      
      try {
          const updatedMilestones = startup.milestones.filter(m => m.id !== milestoneId);
          await updateStartup(startup.id, { milestones: updatedMilestones });
          toast.success("Milestone removed.");
          if (onUpdate) onUpdate();
      } catch (err) {
          toast.error("Failed to remove milestone.");
      }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      gap: isMobile ? '40px' : '32px' 
    }}>
      {/* Description Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', flex: isMobile ? 'none' : 2 }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '32px 24px' : '40px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>Vision & Pitch</h2>
          <ContentRenderer content={startup.description} />
        </div>

        {/* Milestone Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <Target size={24} color="var(--text-primary)" />
               Milestone Timeline
            </h2>
            {isOwner && (
                <button 
                  onClick={() => setIsMilestoneModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                    <Plus size={16} weight="bold" />
                    ADD MILESTONE
                </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
             <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border-hairline)' }} />
             
             {startup.milestones && startup.milestones.length > 0 ? (
               startup.milestones.map((m) => (
                 <div key={m.id} style={{ display: 'flex', gap: isMobile ? '16px' : '24px', position: 'relative' }}>
                    <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-page)', 
                        border: '2px solid var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        flexShrink: 0
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '2px' : '8px', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                   {isMobile ? '' : '• '} {m.date}
                                </span>
                            </div>
                            {isOwner && (
                                <button 
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s', padding: '4px' }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                                >
                                    <Trash size={16} />
                                </button>
                            )}
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.description}</p>
                    </div>
                 </div>
               ))
             ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', fontStyle: 'italic' }}>No milestones recorded yet.</p>
             )}
          </div>
        </div>
      </div>

      {isMilestoneModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)', padding: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-hairline)', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Add Milestone</h3>
                        <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={24} /></button>
                   </div>
                   <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Event Title</label>
                            <input value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} placeholder="e.g. Beta Launch" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date / Month</label>
                            <input value={milestoneForm.date} onChange={e => setMilestoneForm({...milestoneForm, date: e.target.value})} placeholder="e.g. Oct 2025" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description (Brief)</label>
                            <textarea value={milestoneForm.description} onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})} placeholder="What did you achieve?" rows={3} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button type="button" onClick={() => setIsMilestoneModalOpen(false)} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', fontWeight: 700, padding: '12px' }}>CANCEL</button>
                            <button type="submit" disabled={isSubmitting} className="primary" style={{ flex: 2, fontWeight: 800, padding: '12px' }}>{isSubmitting ? 'SAVING...' : 'ADD TO TIMELINE'}</button>
                        </div>
                   </form>
              </div>
          </div>
      )}

      {/* Sidebar Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: isMobile ? 'none' : 1, minWidth: isMobile ? '100%' : '320px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '24px' : '32px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Cpu size={20} weight="thin" />
             Tech Stack
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {startup.tech_stack.map(tech => (
              <span key={tech} style={{ 
                  padding: '6px 14px', 
                  backgroundColor: 'var(--bg-hover)', 
                  border: '0.5px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: isMobile ? '24px' : '32px',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border-hairline)'
        }}>
           <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Calendar size={20} weight="thin" />
             Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Founded</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{startup.founded_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Members</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{startup.member_count} builders</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Created On</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{new Date(startup.created_at).toLocaleDateString()}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
