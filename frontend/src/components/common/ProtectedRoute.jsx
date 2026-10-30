import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, permisos, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111827', color: '#fff' }}>
        <h3>Cargando sistema SRA MILLONES...</h3>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rutaActual = location.pathname;
  const rolUpper = (user.rol || '').toUpperCase();
  const esSuperAdmin = rolUpper.includes('SUPER') || rolUpper.includes('ADMIN');

  // 🟢 1. Admins y SuperAdmins pasan libremente
  if (esSuperAdmin) {
    return children;
  }

  // 🟢 2. Reglas dinámicas por Rol (Garantiza que entren a sus módulos)
  if (rolUpper.includes('MESERO') || rolUpper.includes('MOZO')) {
    if (rutaActual.includes('/mesas') || rutaActual.includes('/reservas') || rutaActual.includes('/perfil')) {
      return children;
    }
  }

  if (rolUpper.includes('CAJA') || rolUpper.includes('CAJERO')) {
    if (rutaActual.includes('/caja') || rutaActual.includes('/despacho') || rutaActual.includes('/perfil')) {
      return children;
    }
  }

  if (rolUpper.includes('COCINA')) {
    if (rutaActual.includes('/cocina') || rutaActual.includes('/perfil')) {
      return children;
    }
  }

  // 🟢 3. Verificación estándar contra array de permisos de MySQL
  const tienePermisoBD = permisos.some(opcion => {
    const rutaBD = typeof opcion === 'string' ? opcion : opcion?.ruta;
    if (!rutaBD) return false;
    return rutaBD.replace(/^\/admin/, '') === rutaActual.replace(/^\/admin/, '');
  });

  if (tienePermisoBD) {
    return children;
  }

  // Si intentó entrar al dashboard sin permiso, lo mandamos a mesas
  if (rolUpper.includes('MESERO') || rolUpper.includes('MOZO')) {
    return <Navigate to="/admin/mesas" replace />;
  }

  return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#e5e7eb' }}>
      <h2 style={{ color: '#ef4444' }}>Acceso Denegado</h2>
      <p>Tu perfil (<strong>{user.rol}</strong>) no posee privilegios para la ruta: <code>{rutaActual}</code></p>
    </div>
  );
};

export default ProtectedRoute;