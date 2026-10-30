import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
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
import MesasPage from '../pages/mesas/MesasPage';
import CocinaPage from '../pages/cocina/CocinaPage';
import ReservasPage from '../pages/reservas/ReservasPage';
import ClientesPage from '../pages/clientes/ClientesPage';

export const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública del Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Administrativas Protegidas con MainLayout */}
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
            <Route path="/admin/clientes" element={<ClientesPage />} />
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