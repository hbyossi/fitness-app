import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-icon">🔍</div>
      <div className="empty-text">העמוד לא נמצא</div>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        חזרה לבית
      </button>
    </div>
  );
}
