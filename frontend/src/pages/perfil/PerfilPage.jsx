import React, { useState } from 'react';
import Toast from '../../components/common/Toast';
import './PerfilPage.css';

export const PerfilPage = () => {
  const [toast, setToast] = useState(null);

  // Datos simulados del usuario en sesión
  const [usuario] = useState({
    username: 'superadmin',
    rol: 'SUPER_ADMIN',
    email: 'superadmin@lajama.com',
    estado: 'Autenticado / Activo'
  });

  return (
    <div className="perfil-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Tarjeta Principal de Perfil */}
      <div className="perfil-card">
        {/* Cabecera / Avatar */}
        <div className="perfil-header-avatar">
          <div className="avatar-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <h2 className="perfil-username-title">{usuario.username}</h2>
          <span className="perfil-role-badge">{usuario.rol}</span>
        </div>

        <div className="perfil-divider-line"></div>

        {/* Sección: Datos Personales */}
        <div className="perfil-section">
          <div className="perfil-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <line x1="7" y1="8" x2="17" y2="8"></line>
              <line x1="7" y1="12" x2="13" y2="12"></line>
              <line x1="7" y1="16" x2="10" y2="16"></line>
            </svg>
            <span>DATOS PERSONALES</span>
          </div>

          <div className="perfil-grid-info">
            {/* Campo 1: Usuario */}
            <div className="perfil-field-group">
              <label className="perfil-label">USUARIO</label>
              <div className="perfil-read-input">
                <span>{usuario.username}</span>
              </div>
            </div>

            {/* Campo 2: Cargo */}
            <div className="perfil-field-group">
              <label className="perfil-label">CARGO OPERATIVO O RANGO</label>
              <div className="perfil-read-input">
                <span>{usuario.rol}</span>
              </div>
            </div>

            {/* Campo 3: Correo Electrónico */}
            <div className="perfil-field-group">
              <label className="perfil-label">CORREO ELECTRÓNICO</label>
              <div className="perfil-read-input">
                <span>{usuario.email}</span>
              </div>
            </div>

            {/* Campo 4: Estado de Cuenta */}
            <div className="perfil-field-group">
              <label className="perfil-label">ESTADO DE CUENTA</label>
              <div className="perfil-read-input status-active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{usuario.estado}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="perfil-card-footer">
          <p>Sesión segura iniciada en los servidores de La Jama.</p>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;