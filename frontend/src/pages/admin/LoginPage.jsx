import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import './LoginPage.css';

export const LoginPage = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña.');
      setToast({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Por favor ingresa tu usuario y contraseña'
      });
      return;
    }
    setError('');
    setToast({
      type: 'info',
      title: 'Iniciando sesión',
      message: 'Verificando credenciales...'
    });
    
    // Simulación de navegación (Maqueta)
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 1000);
  };

  return (
    <div className="login-wrapper">
      {/* Contenedor flotante para notificaciones Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="login-card">
        {/* Lado Izquierdo: Formulario */}
        <div className="login-form-container">
          <h2 className="login-title">¡Bienvenido de vuelta!</h2>
          <p className="login-subtitle">
            Ingresa tus credenciales para acceder al sistema administrativo.
          </p>

          {error && <div className="login-error-msg">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label className="input-label">Usuario o Correo</label>
              <input
                type="text"
                className="custom-input"
                placeholder="Nombre de usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="password-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="custom-input"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? (
                    /* SVG Ojo tachado */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    /* SVG Ojo */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="forgot-wrapper">
              <a href="#forgot" className="forgot-link">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn-submit-login">
              Ingresar al Sistema
              <svg className="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>

        {/* Lado Derecho: Branding / Banner */}
        <div className="login-branding-container">
          <div className="branding-box">
            <div className="chef-hat-icon">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 10.58 0A4 4 0 0 1 18 13.87V21H6z" />
                <line x1="6" y1="17" x2="18" y2="17" />
                <path d="M4 10l-2 8" />
                <path d="M20 10l2 8" />
              </svg>
            </div>
            <h3 className="brand-title">LA JAMA</h3>
            <span className="brand-subtitle">RESTAURANTE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;