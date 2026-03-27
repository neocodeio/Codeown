import React, { useState, useEffect } from 'react';
import type { Startup, JobPosting } from '../../types/startup.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import { Briefcase, Plus, PaperPlaneTilt, Globe, Clock, X, Trash } from 'phosphor-react';
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
            toast.success("Job posted successfully!");
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
        if (!window.confirm("Are you sure you want to delete this job posting?")) return;

        try {
            await deleteStartupJob(startup.id, jobId);
            toast.success("Job deleted successfully");
            fetchJobs();
        } catch (err) {
            toast.error("Failed to delete job");
        }
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
                        onClick={() => setIsPostingModalOpen(true)}
                        className="primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', fontWeight: 800, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                    >
                        <Plus size={16} weight="bold" />
                        Post Job
                    </button>
                )}
            </div>

            {isPostingModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)',
                    padding: '20px'
                }}>
                    <div
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            width: '100%',
                            maxWidth: '500px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-hairline)',
                            padding: '32px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Hire Your Team</h3>
                            <button onClick={() => setIsPostingModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Job Title</label>
                                <input
                                    value={jobForm.title}
                                    onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea
                                    value={jobForm.description}
                                    onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                                    placeholder="Tell potential candidates about the role..."
                                    style={{ minHeight: '120px', width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                    <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Type</label>
                                    <select
                                        value={jobForm.type}
                                        onChange={e => setJobForm({ ...jobForm, type: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                    >
                                        <option>Full-time</option>
                                        <option>Contract</option>
                                        <option>Part-time</option>
                                        <option>Internship</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Location</label>
                                    <input
                                        value={jobForm.location}
                                        onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                                        placeholder="e.g. Remote or NYC"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Salary Range (Optional)</label>
                                <input
                                    value={jobForm.salary_range}
                                    onChange={e => setJobForm({ ...jobForm, salary_range: e.target.value })}
                                    placeholder="e.g. $120k - $160k"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setIsPostingModalOpen(false)} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', fontWeight: 700, padding: '12px' }}>CANCEL</button>
                                <button type="submit" disabled={isSubmitting} className="primary" style={{ flex: 2, fontWeight: 800, padding: '12px' }}>
                                    {isSubmitting ? 'POSTING...' : 'PUBLISH ROLE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '16px' }}>
                                <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{job.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Clock size={14} weight="bold" />
                                        Hiring
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.6, transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                            title="Delete job"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    <Briefcase size={16} weight="thin" />
                                    {job.type}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    <Globe size={16} weight="thin" />
                                    {job.location}
                                </div>
                                {job.salary_range && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        <PaperPlaneTilt size={16} weight="thin" />
                                        {job.salary_range}
                                    </div>
                                )}
                            </div>

                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {job.description}
                            </p>

                            <button className="primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontWeight: 800, borderRadius: 'var(--radius-sm)' }}>
                                APPLY NOW
                            </button>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '64px 32px', border: '1px dashed var(--border-hairline)', borderRadius: 'var(--radius-lg)' }}>
                        <Briefcase size={40} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>No active job openings at the moment.</p>
                        {isOwner && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>Click "Post Job" to start growing your team!</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
