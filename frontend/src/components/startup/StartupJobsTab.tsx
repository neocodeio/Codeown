import React, { useState, useEffect } from 'react';
import type { Startup, JobPosting } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Briefcase, Plus, PaperPlaneTilt, Question, Clock } from 'phosphor-react';
import { toast } from 'react-toastify';
import { getStartupJobs } from '../../api/startups.ts';

interface StartupJobsTabProps {
  startup: Startup;
  isOwner: boolean;
}

export const StartupJobsTab: React.FC<StartupJobsTabProps> = ({ startup, isOwner }) => {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  useEffect(() => {
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
    fetchJobs();
  }, [startup.id]);

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  };

  const handlePostJob = () => {
      toast.info("Opening job creation wizard...");
  };

  return (
    <div style={{ maxWidth: 'var(--feed-width)', margin: '0 auto' }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '0',
          marginBottom: '32px'
      }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={isMobile ? 24 : 28} color="var(--text-primary)" />
              Open Roles
          </h2>
          {isOwner && (
              <button 
                onClick={handlePostJob}
                className="primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', fontWeight: 800, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
              >
                  <Plus size={18} weight="bold" />
                  POST_JOB
              </button>
          )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
                  <div style={{ width: '32px', height: '32px', border: '2px solid var(--border-hairline)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>SEARCHING ROLES...</p>
              </div>
          ) : jobs.length > 0 ? (
              jobs.map(job => (
                  <div key={job.id} style={{
                      padding: isMobile ? '24px' : '32px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => !isMobile && (e.currentTarget.style.borderColor = 'var(--text-tertiary)')}
                  onMouseLeave={(e) => !isMobile && (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
                  >
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '16px' }}>
                          <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{job.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <Clock size={14} weight="bold" />
                              Hiring
                          </div>
                      </div>

                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', opacity: 0.8 }}>
                          {job.description.split('\n')[0]}...
                      </p>

                      <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '20px',
                          borderTop: '0.5px solid var(--border-hairline)' 
                      }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Question size={16} color="var(--text-tertiary)" />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{job.custom_questions.length} questions</span>
                          </div>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                            className="primary"
                            style={{
                                padding: '8px 20px',
                                fontWeight: 800,
                                fontSize: '13px'
                            }}
                          >
                              Apply
                          </button>
                      </div>
                  </div>
              ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border-hairline)' }}>
                 <Briefcase size={48} weight="thin" style={{ marginBottom: '16px' }} />
                 <p>No open positions at the moment.</p>
            </div>
          )}
      </div>

      {isApplicationModalOpen && selectedJob && (
          <JobApplicationModal 
            startupName={startup.name}
            job={selectedJob} 
            isMobile={isMobile}
            onClose={() => setIsApplicationModalOpen(false)} 
            onSubmit={() => {
                setIsApplicationModalOpen(false);
                toast.success("Application sent to the founder!");
            }}
          />
      )}
    </div>
  );
};

// Internal Modal Component for Task 3
const JobApplicationModal = ({ startupName, job, isMobile, onClose, onSubmit }: { startupName: string, job: JobPosting, isMobile: boolean, onClose: () => void, onSubmit: () => void }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(onSubmit, 1500);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '12px' : '24px'
        }} onClick={onClose}>
            <div 
                style={{
                    backgroundColor: 'var(--bg-page)',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-hairline)',
                    padding: isMobile ? '28px 20px' : '48px',
                    position: 'relative'
                }} 
                onClick={e => e.stopPropagation()}
                className="scale-in"
            >
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Join {startupName}</span>
                        <span style={{ color: 'var(--border-hairline)', fontSize: '10px' }}>•</span>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{job.title}</span>
                    </div>
                    <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Founder's Questions</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {job.custom_questions.map(q => (
                        <div key={q.id}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{q.question}</label>
                            {q.type === 'text' ? (
                                <textarea 
                                    required
                                    rows={3}
                                    placeholder="Your answer..."
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {q.options?.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: answers[q.id] === opt ? 'var(--text-primary)' : 'var(--bg-hover)',
                                                color: answers[q.id] === opt ? 'var(--bg-page)' : 'var(--text-primary)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '13px',
                                                fontWeight: 800,
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {opt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '12px', marginTop: '16px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, fontWeight: 700, padding: '12px' }}>CANCEL</button>
                        <button 
                            type="submit" 
                            className="primary" 
                            disabled={isSubmitting}
                            style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800 }}
                        >
                            {isSubmitting ? (
                                <div style={{ width: '16px', height: '16px', border: '1.5px solid var(--bg-page)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : (
                                <>
                                    <PaperPlaneTilt size={20} weight="bold" />
                                    SEND APPLICATION
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
