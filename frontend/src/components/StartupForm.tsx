import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Startup } from '../types/startup';
import { ArrowLeft, FloppyDiskBack, HardDrive, PaperPlaneTilt, Link as LinkIcon, Calendar, UserPlus } from 'phosphor-react';
import { toast } from 'react-toastify';

interface StartupFormProps {
  initialData?: Partial<Startup>;
  isEditing?: boolean;
}

export const StartupForm: React.FC<StartupFormProps> = ({ initialData, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    tagline: initialData?.tagline || '',
    description: initialData?.description || '',
    logo_url: initialData?.logo_url || null,
    website_url: initialData?.website_url || '',
    founded_date: initialData?.founded_date || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'Active',
    looking_for_cofounder: initialData?.looking_for_cofounder || false,
    is_hiring: initialData?.is_hiring || false,
    tech_stack: initialData?.tech_stack?.join(', ') || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Startup name is required.';
    if (formData.name.length > 50) newErrors.name = 'Startup name cannot exceed 50 characters.';
    if (!formData.tagline.trim()) newErrors.tagline = 'Tagline is required.';
    if (formData.tagline.length > 100) newErrors.tagline = 'Tagline cannot exceed 100 characters.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL (starting with http:// or https://).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo_url: reader.result as string });
        toast.info("Logo selected locally.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(isEditing ? 'Startup updated successfully.' : 'Startup launched successfully!');
      navigate('/startups');
    } catch (err) {
      toast.error('Failed to save startup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 40px', maxWidth: '800px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          marginBottom: '32px',
          color: 'var(--text-tertiary)',
          border: 'none',
          backgroundColor: 'transparent',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} weight="bold" />
        Back
      </button>

      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
          {isEditing ? 'Manage Startup' : 'Launch a new Startup'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          {isEditing ? 'Keep your startup profile up to date.' : 'Define your vision and find your team.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Core Identity */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
            <div 
                onClick={handleLogoClick}
                style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px dashed var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
            >
                {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <>
                        <HardDrive size={32} weight="thin" color="var(--text-tertiary)" />
                        <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 800, marginTop: '8px' }}>UPLOAD LOGO</span>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Startup Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Codeown"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{ border: errors.name ? '0.5px solid #ef4444' : '0.5px solid var(--border-hairline)' }}
                    />
                    {errors.name && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
                </div>
            </div>
        </div>

        <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tagline (Unique Selling Proposition)</label>
            <input
                type="text"
                placeholder="A one-sentence pitch of what you build."
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                style={{ border: errors.tagline ? '0.5px solid #ef4444' : '0.5px solid var(--border-hairline)' }}
            />
            {errors.tagline && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.tagline}</span>}
        </div>

        <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Description (Markdown supported)</label>
            <textarea
                placeholder="Detailed explanation, roadmap, and vision..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                style={{ border: errors.description ? '0.5px solid #ef4444' : '0.5px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)' }}
            />
            {errors.description && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '24px' }}>
            <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <LinkIcon size={14} /> Website URL
                </label>
                <input
                    type="text"
                    placeholder="https://mysuperstartup.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    style={{ border: errors.website_url ? '0.5px solid #ef4444' : '0.5px solid var(--border-hairline)' }}
                />
                {errors.website_url && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.website_url}</span>}
            </div>
            <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <Calendar size={14} /> Founded Date
                </label>
                <input
                    type="date"
                    value={formData.founded_date}
                    onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                />
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Current Status</label>
                <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-hairline)' }}>
                    {['Active', 'Built', 'Paused'].map(s => (
                        <button
                            type="button"
                            key={s}
                            onClick={() => setFormData({ ...formData, status: s as any })}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: formData.status === s ? 'var(--bg-card)' : 'transparent',
                                color: formData.status === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Tech Stack (Optional)</label>
                 <input
                    type="text"
                    placeholder="e.g. TypeScript, Rust, Postgres"
                    value={formData.tech_stack}
                    onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                />
            </div>
        </div>

        {/* Co-founder & Hiring Toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div 
                onClick={() => setFormData({ ...formData, looking_for_cofounder: !formData.looking_for_cofounder })}
                style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.looking_for_cofounder ? '1px solid var(--text-primary)' : '0.5px solid var(--border-hairline)',
                    backgroundColor: formData.looking_for_cofounder ? 'var(--bg-hover)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ 
                    padding: '10px', 
                    borderRadius: 'var(--radius-xs)', 
                    backgroundColor: formData.looking_for_cofounder ? 'var(--text-primary)' : 'var(--bg-hover)',
                    color: formData.looking_for_cofounder ? 'var(--bg-page)' : 'var(--text-tertiary)'
                }}>
                    <UserPlus size={20} weight="bold" />
                </div>
                <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>Looking for Co-founder</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Signal you are open to partnership.</p>
                </div>
            </div>

            <div 
                onClick={() => setFormData({ ...formData, is_hiring: !formData.is_hiring })}
                style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.is_hiring ? '1px solid var(--text-primary)' : '0.5px solid var(--border-hairline)',
                    backgroundColor: formData.is_hiring ? 'var(--bg-hover)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ 
                    padding: '10px', 
                    borderRadius: 'var(--radius-xs)', 
                    backgroundColor: formData.is_hiring ? 'var(--text-primary)' : 'var(--bg-hover)',
                    color: formData.is_hiring ? 'var(--bg-page)' : 'var(--text-tertiary)'
                }}>
                    <PaperPlaneTilt size={20} weight="bold" />
                </div>
                <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>Active Hiring</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Enable the hiring badge on cards.</p>
                </div>
            </div>
        </div>

        <button
          type="submit"
          className="primary"
          disabled={isSubmitting}
          style={{
            marginTop: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? (
              <div style={{ width: '16px', height: '16px', border: '1.5px solid var(--bg-page)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : (
              <FloppyDiskBack size={18} weight="bold" />
          )}
          {isEditing ? 'Save Changes' : 'Launch Startup'}
        </button>
      </form>
    </div>
  );
};
