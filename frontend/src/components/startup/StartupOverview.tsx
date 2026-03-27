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
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', 
      gap: isMobile ? '64px' : '80px',
      padding: isMobile ? '0' : '20px 0'
    }}>
      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
        <section>
          <h2 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
              Vision & Pitch
          </h2>
          <div style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.8 }}>
            <ContentRenderer content={startup.description} />
          </div>
        </section>

        {/* Milestone Timeline */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
               Milestone Timeline
            </h2>
            {isOwner && (
                <button 
                  onClick={() => setIsMilestoneModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                    <Plus size={14} weight="bold" />
                    ADD EVENT
                </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative' }}>
             <div style={{ position: 'absolute', left: '23px', top: '10px', bottom: '10px', width: '1px', backgroundColor: 'var(--border-hairline)' }} />
             
             {startup.milestones && startup.milestones.length > 0 ? (
               startup.milestones.map((m) => (
                 <div key={m.id} style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-page)', 
                        border: '1px solid var(--border-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        flexShrink: 0
                    }}>
                        <Target size={20} weight="thin" color="var(--text-secondary)" />
                    </div>
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{m.title}</h3>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{m.date}</span>
                            </div>
                            {isOwner && (
                                <button 
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', opacity: 0.3, transition: 'all 0.2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                                >
                                    <Trash size={14} />
                                </button>
                            )}
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>{m.description}</p>
                    </div>
                 </div>
               ))
             ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '64px' }}>No milestones recorded yet.</p>
             )}
          </div>
        </section>
      </div>

      {/* Sidebar Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
          <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Cpu size={16} weight="thin" /> Tech Stack
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {startup.tech_stack.map(tech => (
              <span key={tech} style={{ 
                  padding: '5px 12px', 
                  backgroundColor: 'var(--bg-hover)', 
                  border: '0.5px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </section>

        <section>
           <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Calendar size={16} weight="thin" /> Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Founded</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{startup.founded_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Capacity</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{startup.member_count} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Registration</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{new Date(startup.created_at).toLocaleDateString()}</span>
              </div>
          </div>
        </section>
      </div>

      {isMilestoneModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)', padding: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)', padding: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Add Milestone</h3>
                        <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
                   </div>
                   <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Title</label>
                            <input value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} placeholder="e.g. Seed Round" />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Date</label>
                            <input value={milestoneForm.date} onChange={e => setMilestoneForm({...milestoneForm, date: e.target.value})} placeholder="e.g. Q4 2025" />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Description</label>
                            <textarea value={milestoneForm.description} onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})} placeholder="..." rows={3} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button type="submit" disabled={isSubmitting} className="primary" style={{ flex: 1, padding: '12px' }}>{isSubmitting ? '...' : 'SAVE EVENT'}</button>
                        </div>
                   </form>
              </div>
          </div>
      )}
    </div>
  );
};
