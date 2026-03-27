import React, { useState, useEffect } from 'react';
import type { Startup, JobPosting } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Plus, Globe, Clock, X, Trash, CurrencyDollar } from 'phosphor-react';
import { toast } from 'react-toastify';
import { getStartupJobs, createStartupJob, deleteStartupJob } from '../../api/startups.ts';

interface StartupJobsTabProps {
  startup: Startup;
  isOwner: boolean;
}

export const StartupJobsTab: React.FC<StartupJobsTabProps> = ({ startup, isOwner }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [jobForm, setJobForm] = useState({
      title: '',
      description: '',
      type: 'Full-time',
      location: 'Remote',
      salary_range: ''
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getStartupJobs(startup.id);
      setJobs(data);
    } catch (err) {
      toast.error("Failed to load job postings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [startup.id]);

  const handlePostJob = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!jobForm.title || !jobForm.description) {
          toast.error("Please fill in basic job details.");
          return;
      }

      setIsSubmitting(true);
      try {
          await createStartupJob(startup.id, jobForm);
          toast.success("Job posted.");
          setIsPostingModalOpen(false);
          setJobForm({ title: '', description: '', type: 'Full-time', location: 'Remote', salary_range: '' });
          fetchJobs();
      } catch (err) {
          toast.error("Failed to post job.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteJob = async (jobId: string) => {
      if (!window.confirm("Remove this opening?")) return;
      try {
          await deleteStartupJob(startup.id, jobId);
          toast.success("Job removed.");
          fetchJobs();
      } catch (err) {
          toast.error("Failed to delete job.");
      }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0' : '20px 0' }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '0.5px solid var(--border-hairline)'
      }}>
          <h2 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Open Positions
          </h2>
          {isOwner && (
              <button 
                onClick={() => setIsPostingModalOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                  <Plus size={14} weight="bold" />
                  POST OPENING
              </button>
          )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                  <div style={{ width: '20px', height: '20px', border: '1.5px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
          ) : jobs.length > 0 ? (
              jobs.map(job => (
                  <div key={job.id} style={{
                      padding: '32px 0',
                      borderBottom: '0.5px solid var(--border-hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                      animation: 'fadeIn 0.4s ease'
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                          <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{job.title}</h3>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                      <Globe size={14} weight="thin" />
                                      {job.location}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                      <Clock size={14} weight="thin" />
                                      {job.type}
                                  </div>
                                  {job.salary_range && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                          <CurrencyDollar size={14} weight="thin" />
                                          {job.salary_range}
                                      </div>
                                  )}
                              </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                              {isOwner && (
                                <button 
                                  onClick={() => handleDeleteJob(job.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', opacity: 0.3, transition: 'all 0.2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                                >
                                    <Trash size={16} />
                                </button>
                              )}
                              <button className="primary" style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 800 }}>APPLY</button>
                          </div>
                      </div>
                      
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '720px' }}>
                          {job.description}
                      </p>
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>NO OPEN ROLES AT THIS TIME</p>
              </div>
          )}
      </div>

      {isPostingModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)', padding: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)', padding: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Post Opening</h3>
                        <button onClick={() => setIsPostingModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
                   </div>
                   <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Role Title</label>
                            <input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="e.g. Lead Designer" />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Description</label>
                            <textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} placeholder="..." rows={4} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Type</label>
                                <select value={jobForm.type} onChange={e => setJobForm({...jobForm, type: e.target.value})} style={{ width: '100%', padding: '12px', border: '0.5px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '14px' }}>
                                    <option>Full-time</option>
                                    <option>Contract</option>
                                    <option>Co-founder</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Location</label>
                                <input value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} placeholder="Remote / NYC" />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Comp Range</label>
                            <input value={jobForm.salary_range} onChange={e => setJobForm({...jobForm, salary_range: e.target.value})} placeholder="e.g. $100k+ or 2% Eq" />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="primary" style={{ marginTop: '12px', padding: '12px' }}>{isSubmitting ? '...' : 'PUBLISH OPENING'}</button>
                   </form>
              </div>
          </div>
      )}
    </div>
  );
};
