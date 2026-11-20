import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Páginas Públicas
import LoginPage from '../pages/admin/LoginPage';
import CartaPublicaPage from '../pages/carta/CartaPublicaPage'; 

// Layout y Páginas del Panel Administrativo
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductosPage from '../pages/productos/ProductosPage';
import PreciosPage from '../pages/precios/PreciosPage';
import PerfilPage from '../pages/perfil/PerfilPage';
import UsuariosPage from '../pages/usuarios/UsuariosPage';
import RolesPage from '../pages/roles/RolesPage';
import EmpleadosPage from '../pages/empleados/EmpleadosPage';
import CajaPage from '../pages/caja/CajaPage';
import MesasPage from '../pages/mesas/MesasPage';
import CocinaPage from '../pages/cocina/CocinaPage';
import ReservasPage from '../pages/reservas/ReservasPage';

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🟢 Rutas Públicas (Disponibles sin iniciar sesión y con acceso al AuthContext) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/carta" element={<CartaPublicaPage />} />

          {/* 🔒 Rutas Administrativas Protegidas con MainLayout */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/productos" element={<ProductosPage />} />
            <Route path="/admin/productos-ajuste" element={<PreciosPage />} />
            <Route path="/admin/perfil" element={<PerfilPage />} />
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/perfiles" element={<RolesPage />} />
            <Route path="/admin/empleados" element={<EmpleadosPage />} />
            <Route path="/admin/mesas" element={<MesasPage />} />
            <Route path="/admin/cocina" element={<CocinaPage />} />
            <Route path="/admin/reservas" element={<ReservasPage />} />
            
            {/* Cajas y fondos */}
            <Route path="/admin/caja" element={<CajaPage tabInicial="TURNO" />} />
            <Route path="/admin/caja-chica" element={<CajaPage tabInicial="CHICA" />} />
            <Route path="/admin/caja-general" element={<CajaPage tabInicial="GENERAL" />} />
          </Route>

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;