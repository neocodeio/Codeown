import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    Download01Icon,
    Link01Icon
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";

interface LightboxProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    postUrl?: string;
    author?: {
        name: string;
        username: string | null;
        avatar_url: string | null;
    };
    altText?: string;
}

const Lightbox: React.FC<LightboxProps> = ({ isOpen, onClose, imageSrc, postUrl, author, altText }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `codeown-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info("Downloading image...");
    };

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const linkToCopy = postUrl || imageSrc;
        navigator.clipboard.writeText(linkToCopy).then(() => {
            toast.success(postUrl ? "Post link copied!" : "Image link copied!");
        });
    };

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px)',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                animation: 'lightboxFadeIn 0.25s ease-out'
            }}
            onClick={onClose}
        >
            {/* Header / Top Controls */}
            <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                position: 'absolute',
                top: 0,
                zIndex: 10
            }}>
                {/* User Info */}
                {author ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={author.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{author.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>@{author.username || 'user'}</span>
                        </div>
                    </div>
                ) : <div />}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={handleCopyLink}
                        className="lightbox-action-btn"
                        title="Copy link"
                    >
                        <HugeiconsIcon icon={Link01Icon} size={28} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="lightbox-action-btn"
                        title="Download"
                    >
                        <HugeiconsIcon icon={Download01Icon} size={28} />
                    </button>
                    <button
                        onClick={onClose}
                        className="lightbox-action-btn"
                        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
                        title="Close"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={28} />
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                <img
                    src={imageSrc}
                    alt={altText || 'Expanded view'}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: "var(--radius-sm)",
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        animation: 'lightboxZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <style>{`
                @keyframes lightboxFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes lightboxZoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .lightbox-action-btn {
                    background: rgba(255, 255, 255, 0.08);
                    border: none;
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(8px);
                }
                .lightbox-action-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>,
        document.body
    );
};

export default Lightbox;
