import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
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
      </div>
    </nav>
  );
}
