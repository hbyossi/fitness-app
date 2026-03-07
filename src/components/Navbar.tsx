import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signIn, logOut } = useAuth();

  return (
    <>
      <div className="auth-bar">
        {user ? (
          <div className="auth-bar-inner">
            <span className="auth-user">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="auth-avatar" referrerPolicy="no-referrer" />
              )}
              {user.displayName?.split(' ')[0]}
            </span>
            <button className="auth-btn" onClick={logOut}>
              התנתק
            </button>
          </div>
        ) : (
          <div className="auth-bar-inner">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              לא מחובר — נתונים מקומיים בלבד
            </span>
            <button className="auth-btn auth-btn-primary" onClick={signIn}>
              התחבר עם Google
            </button>
          </div>
        )}
      </div>

      <nav className="navbar">
        <div className="navbar-inner">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">🏠</span>
          <span>בית</span>
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">➕</span>
          <span>תוכנית חדשה</span>
        </NavLink>
        <NavLink to="/bank" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📚</span>
          <span>מאגר תרגילים</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          <span>היסטוריה</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📈</span>
          <span>התקדמות</span>
        </NavLink>
        </div>
      </nav>
    </>
  );
}
