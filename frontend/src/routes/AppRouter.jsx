import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/admin/LoginPage';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductosPage from '../pages/productos/ProductosPage';
import PreciosPage from '../pages/precios/PreciosPage';
import PerfilPage from '../pages/perfil/PerfilPage';
import UsuariosPage from '../pages/usuarios/UsuariosPage';
import RolesPage from '../pages/roles/RolesPage';
import EmpleadosPage from '../pages/empleados/EmpleadosPage';
import CajaPage from '../pages/caja/CajaPage';

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública del Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Administrativas Protegidas con el Layout Fijo */}
          <Route element={<MainLayout />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/productos" element={<ProductosPage />} />
            <Route path="/admin/productos-ajuste" element={<PreciosPage />} />
            <Route path="/admin/perfil" element={<PerfilPage />} />
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/perfiles" element={<RolesPage />} />
            <Route path="/admin/empleados" element={<EmpleadosPage />} />
            <Route path="/admin/caja" element={<CajaPage />} />

          </Route>

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};