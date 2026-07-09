import React from 'react';
import { EMERGENCY_MESSAGE } from '../lib/constants';

export function GoldDivider({ children }) {
  return (
    <div className="gold-divider">
      <span className="line" />
      {children && <span className="mark">{children}</span>}
      <span className="line" />
    </div>
  );
}

export function EmptyState({ emoji = '🌤️', title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="emoji">{emoji}</div>
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

export function EmergencyBanner() {
  return (
    <div className="emergency-banner" role="alert">
      <span>🚨</span>
      <span>{EMERGENCY_MESSAGE}</span>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" style={wide ? { maxWidth: 760 } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className="section-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = 'אישור פעולה', message, confirmLabel = 'אישור', danger, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function Badge({ children, tone }) {
  const cls = tone ? `badge badge-${tone}` : 'badge';
  return <span className={cls}>{children}</span>;
}

export function SourceTag({ sources }) {
  if (!sources || !sources.length) return null;
  const labels = {
    DATA: 'נתון מתועד', SUGGESTION: 'הצעה לפעולה', DOC: 'מידע ממסמך (טרם אושר)', SUMMARY: 'סיכום שנוצר אוטומטית',
  };
  return <span className="source-tag">מקור: {sources.map((s) => labels[s.type] || s.label).join(' · ')}</span>;
}
