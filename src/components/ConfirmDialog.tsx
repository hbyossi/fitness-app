import React from 'react';

interface ConfirmDialogProps {
  title: string;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, text, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-text">{text}</div>
        <div className="dialog-actions">
          <button className="btn btn-danger" onClick={onConfirm}>אישור</button>
          <button className="btn btn-ghost" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
