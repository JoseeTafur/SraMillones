import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { miPerfilService } from '../../services/miPerfilService';
import Toast from '../../components/common/Toast';
import './PerfilPage.css';

export const PerfilPage = () => {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [perfilData, setPerfilData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      setLoading(true);
      try {
        const res = await miPerfilService.obtenerMiPerfil();
        if (res && res.success) {
          setPerfilData(res.data);
        } else if (user) {
          // Fallback seguro usando AuthContext si el endpoint responde con datos mínimos
          setPerfilData({
            username: user.nombreUsuario || user.usuario || 'Usuario',
            rol: user.rol || 'SIN_ROL',
            nombreCompleto: 'Personal de SRA MILLONES',
            turno: 'Único',
            estado: 'Autenticado / Activo'
          });
        }
      } catch (err) {
        console.error("Error al cargar datos del perfil:", err);
        if (user) {
          setPerfilData({
            username: user.nombreUsuario || user.usuario || 'Usuario',
            rol: user.rol || 'SIN_ROL',
            nombreCompleto: 'Personal de SRA MILLONES',
            turno: 'Único',
            estado: 'Autenticado / Activo'
          });
        } else {
          setToast({
            type: 'error',
            title: 'Error de Red',
            message: 'No se pudieron consultar los datos del perfil activo.'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    cargarDatosPerfil();
  }, [user]);

  if (loading) {
    return (
      <div className="perfil-page-container">
        <div className="perfil-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando información del perfil...</p>
        </div>
      </div>
    );
  }

  const username = perfilData?.username || user?.nombreUsuario || 'Usuario';
  const rol = perfilData?.rol || user?.rol || 'SIN_ROL';
  const nombreCompleto = perfilData?.nombreCompleto || 'Personal de SRA MILLONES';
  const dni = perfilData?.dni || 'No registrado';
  const telefono = perfilData?.telefono || 'No registrado';
  const turno = perfilData?.turno || 'Único';
  const estado = perfilData?.estado || 'Autenticado / Activo';

  return (
    <div className="perfil-page-container">
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

      <div className="perfil-card">
        {/* Cabecera / Avatar */}
        <div className="perfil-header-avatar">
          <div className="avatar-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <h2 className="perfil-username-title">{username}</h2>
          <span className="perfil-role-badge">{rol}</span>
        </div>

        <div className="perfil-divider-line"></div>

        {/* Datos Personales y de Sesión */}
        <div className="perfil-section">
          <div className="perfil-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <line x1="7" y1="8" x2="17" y2="8"></line>
              <line x1="7" y1="12" x2="13" y2="12"></line>
              <line x1="7" y1="16" x2="10" y2="16"></line>
            </svg>
            <span>INFORMACIÓN DE MI PERFIL</span>
          </div>

          <div className="perfil-grid-info">
            <div className="perfil-field-group">
              <label className="perfil-label">USUARIO</label>
              <div className="perfil-read-input">
                <span>{username}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">ROL O RANGO OPERATIVO</label>
              <div className="perfil-read-input">
                <span>{rol}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">NOMBRES Y APELLIDOS</label>
              <div className="perfil-read-input">
                <span>{nombreCompleto}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">DOCUMENTO DE IDENTIDAD (DNI)</label>
              <div className="perfil-read-input">
                <span>{dni}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">TELÉFONO DE CONTACTO</label>
              <div className="perfil-read-input">
                <span>{telefono}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">TURNO ASIGNADO</label>
              <div className="perfil-read-input">
                <span>{turno}</span>
              </div>
            </div>

            <div className="perfil-field-group">
              <label className="perfil-label">ESTADO DE CUENTA</label>
              <div className="perfil-read-input status-active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{estado}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="perfil-card-footer">
          <p>Sesión activa e identificada en los servidores de SRA MILLONES.</p>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;