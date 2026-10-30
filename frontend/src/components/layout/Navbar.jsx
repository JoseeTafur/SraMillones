import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export const Navbar = ({ toggleSidebar, pageTitle = 'PANEL DE CONTROL' }) => {
  const { user } = useAuth();
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <button className="btn-hamburger" onClick={toggleSidebar} title="Alternar menú">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 className="navbar-page-title">{pageTitle}</h1>
      </div>

      <div className="navbar-right">
        {/* Fecha Actual */}
        <div className="navbar-date-pill">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className="capitalize">{fechaHoy}</span>
        </div>

        {/* Notificaciones */}
        <button className="btn-icon-nav" title="Notificaciones">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="badge-dot"></span>
        </button>

        {/* Perfil Usuario */}
        <div className="navbar-user-card">
          <div className="user-avatar-initial">
            {user?.nombre ? user.nombre.charAt(0) : 'U'}
          </div>
          <div className="user-text-info">
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
            <span className="user-role-label">{user?.rol || 'MESERO'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};