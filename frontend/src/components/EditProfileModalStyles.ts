export const editProfileModalStyles = `
  @keyframes modalFadeIn {
    from { opacity: 0; } 
    to { opacity: 1; } 
  }

  @keyframes modalSlideIn { 
    from { opacity: 0; transform: scale(0.95) translateY(-20px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
  }

  .modal-backdrop { 
    animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
  }

  .modal-dialog { 
    animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
  }

  .modal-input {
    width: 100%;
    padding: 14px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.2s ease;
    background: #f8fafc;
    color: var(--text-primary);
    outline: none;
    box-sizing: border-box;
  }

  @media (max-width: 640px) {
    .modal-input {
      padding: 12px 16px;
      font-size: 14px;
    }
  }

  .modal-input:focus {
    border-color: #212121;
    background: white;
    box-shadow: 0 0 0 4px rgba(33, 33, 33, 0.05);
  }

  .modal-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-label {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
    margin-left: 4px;
  }

  .modal-btn {
    padding: 12px 24px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .modal-btn-primary {
    background: #212121;
    color: white;
    border: none;
  }

  .modal-btn-primary:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }

  .modal-btn-secondary {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .modal-btn-secondary:hover { 
    background: #f1f5f9; 
    color: #0f172a; 
    border-color: #cbd5e1; 
  }

  .skill-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    color: var(--text-primary);
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid #e2e8f0;
  }

  .skill-remove {
    cursor: pointer;
  }

  .skill-remove:hover {
    color: #ef4444; 
  }

  .modal-label {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
    margin-left: 4px;
  }

  .modal-btn {
    padding: 12px 24px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .modal-btn-primary {
    background: #212121;
    color: white;
    border: none;
  }

  .modal-btn-primary:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }

  .modal-btn-secondary {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .modal-btn-secondary:hover { 
    background: #f1f5f9; 
    color: #0f172a; 
    border-color: #cbd5e1; 
  }
`;
