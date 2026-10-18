import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import './MainLayout.css';

export const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Diccionario para asignar el título según la ruta actual
  const titulosRutas = {
    '/admin/dashboard': 'PANEL DE CONTROL',
    '/admin/productos': 'CATÁLOGO DE PRODUCTOS Y PLATOS',
    '/admin/perfil': 'MI PERFIL',
    '/admin/mesas': 'MAPA DE MESAS',
    '/admin/caja': 'GESTIÓN DE CAJA',
  };

  const pageTitle = titulosRutas[location.pathname] || 'SISTEMA ADMINISTRATIVO';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="layout-wrapper">
      {/* El Sidebar se renderiza una sola vez y nunca se desmonta */}
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="layout-main-content">
        <Navbar toggleSidebar={toggleSidebar} pageTitle={pageTitle} />
        <main className="layout-page-body">
          {/* Outlet carga la página actual dinámicamente sin recargar el Sidebar */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;