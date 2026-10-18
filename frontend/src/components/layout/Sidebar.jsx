import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber en qué página/URL estamos actualmente

  // Configuración completa del menú
  const menuConfig = [
    {
      title: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      ),
      path: '/admin/dashboard',
      roles: ['ADMIN', 'CAJERO']
    },
    {
      title: 'Salón & Mesas',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      key: 'salon',
      roles: ['ADMIN', 'MESERO', 'CAJERO'],
      submenu: [
        { title: 'Mapa de Mesas', path: '/admin/mesas' },
        { title: 'Reservas', path: '/admin/reservas' }
      ]
    },
    {
      title: 'Estación Cocina',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      key: 'cocina',
      roles: ['ADMIN', 'COCINA'],
      submenu: [
        { title: 'Cocina', path: '/admin/cocina' }
      ]
    },
    {
      title: 'Caja & Ventas',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      ),
      key: 'caja',
      roles: ['ADMIN', 'CAJERO'],
      submenu: [
        { title: 'Caja Abierta', path: '/admin/caja' }
      ]
    },
    {
      title: 'Almacén & Menú',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
      key: 'almacen',
      roles: ['ADMIN'],
      submenu: [
        { title: 'Catálogo Productos', path: '/admin/productos' },
        { title: 'Ajuste de Precios', path: '/admin/productos-ajuste' },
      ]
    },
    {
      title: 'Administración',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      key: 'admin',
      roles: ['ADMIN'],
      submenu: [
        { title: 'Mi Perfil', path: '/admin/perfil' },
        { title: 'Usuarios', path: '/admin/usuarios' },
        { title: 'Perfiles', path: '/admin/perfiles' },
        { title: 'Empleados', path: '/admin/empleados' }
      ]
    }
  ];

  // Estado del submenú abierto
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // EFECTO MÁGICO: Mantiene abierto automáticamente el submenú de la ruta actual
  useEffect(() => {
    const activeGroup = menuConfig.find((item) =>
      item.submenu?.some((sub) => sub.path === location.pathname)
    );
    if (activeGroup) {
      setOpenSubmenu(activeGroup.key);
    }
  }, [location.pathname]);

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenu(openSubmenu === menuKey ? null : menuKey);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.rol || 'ADMIN';
  const filteredMenu = menuConfig.filter((item) => item.roles.includes(userRole));

  return (
    <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header del Sidebar */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrapper">
          <div className="brand-logo-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 10.58 0A4 4 0 0 1 18 13.87V21H6z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <span className="logo-glow"></span>
        </div>

        {!isCollapsed && (
          <div className="brand-info">
            <span className="brand-name">LA JAMA</span>
            <div className="brand-badge-pill">
              <span className="badge-pulse"></span>
              <span className="brand-badge-text">{userRole}</span>
            </div>
          </div>
        )}
      </div>

      {/* Menú de Opciones */}
      <nav className="sidebar-nav">
        {filteredMenu.map((item) => {
          if (!item.submenu) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.title : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-title">{item.title}</span>}
                <span className="active-indicator"></span>
              </NavLink>
            );
          }

          const isSubmenuOpen = openSubmenu === item.key;
          const isCategoryActive = item.submenu.some((sub) => sub.path === location.pathname);

          return (
            <div key={item.key} className={`nav-item-group ${isSubmenuOpen ? 'open' : ''}`}>
              <div 
                className={`nav-item has-submenu ${isCategoryActive ? 'category-active' : ''}`} 
                onClick={() => toggleSubmenu(item.key)}
                title={isCollapsed ? item.title : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="nav-title">{item.title}</span>
                    <svg
                      className={`chevron-icon ${isSubmenuOpen ? 'rotate' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </>
                )}
              </div>

              {!isCollapsed && (
                <div className={`submenu-wrapper ${isSubmenuOpen ? 'expanded' : ''}`}>
                  <div className="submenu-list">
                    {item.submenu.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                      >
                        <span className="submenu-dot"></span>
                        <span className="submenu-title">{sub.title}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Botón de Salir */}
      <div className="sidebar-footer">
        <button className="btn-logout-sidebar" onClick={handleLogout} title="Cerrar Sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;