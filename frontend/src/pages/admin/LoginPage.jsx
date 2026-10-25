import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';    // Regresado a dos niveles (../../)
import Toast from '../../components/common/Toast';        // Regresado a dos niveles (../../)
import './LoginPage.css';
import logoImage from '../../assets/logo2.png';   


export const LoginPage = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (loading) return;

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
    setLoading(true);
    setToast({
      type: 'info',
      title: 'Iniciando sesión',
      message: 'Verificando credenciales en el servidor...'
    });
    
    try {
      const res = await login(usuario.trim(), password.trim());

      if (res.success) {
        setToast({
          type: 'info',
          title: '¡Bienvenido!',
          message: 'Sesión iniciada correctamente.'
        });

        const rol = (res.user?.rol || '').toUpperCase();

        setTimeout(() => {
          if (rol.includes('MESERO') || rol.includes('MOZO')) {
            navigate('/admin/mesas');
          } else if (rol.includes('CAJA') || rol.includes('CAJERO')) {
            navigate('/admin/caja');
          } else if (rol.includes('COCINA')) {
            navigate('/admin/cocina');
          } else {
            navigate('/admin/dashboard');
          }
        }, 500);

      } else {
        const mensajeError = res.message || 'Credenciales incorrectas.';
        setError(mensajeError);
        setToast({
          type: 'error',
          title: 'Acceso Denegado',
          message: mensajeError
        });
      }
    } catch (err) {
      console.error("Error en el login:", err);
      setError('Servidor no disponible o error de red.');
      setToast({
        type: 'error',
        title: 'Error del sistema',
        message: 'Servidor no disponible.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
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
                disabled={loading}
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
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar u ocultar contraseña"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
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

            <button 
              type="submit" 
              className={`btn-submit-login ${loading ? 'is-loading' : ''}`} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-loader"></span>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <svg className="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="login-branding-container">
          <img 
            src={logoImage} 
            alt="SRA MILLONES Restaurante Criollo" 
            className="login-brand-asset-full"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;