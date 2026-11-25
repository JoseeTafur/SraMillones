import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';
import logoImage from '../../assets/logo.png';
import { getSidebarOptions } from '../../services/sidebar.service';

export const Sidebar = ({ isCollapsed }) => {
  const { user, permisos, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [opcionesSidebar, setOpcionesSidebar] = useState([]);

  const rolUpper = (user?.rol || '').toUpperCase();
  const esAdminAbsoluto = rolUpper.includes('SUPER') || rolUpper.includes('ADMIN');

  const rutasHabilitadas = React.useMemo(() => {
    if (!Array.isArray(permisos)) return [];
    return permisos
      .map(p => (typeof p === 'string' ? p : p?.ruta))
      .filter(Boolean);
  }, [permisos]);

  //#region V2

  const cargarOpcionesSidebar = async () => {
    try {
      const res = await getSidebarOptions();
      if (res && res.success) setOpcionesSidebar(filterMenu(sortOpciones(res.data)));
    } catch (e) {
      console.error("Error al cargar opciones sidebar:", e);
      setToast({
        type: 'error',
        title: 'Error de Carga',
        message: 'No se pudieron recuperar las opciones. Asegúrese de haber iniciado sesión.'
      });
    }
  }

  const sortOpciones = (opcionesRaw) => {
    if (!opcionesRaw || (!opcionesRaw.grupoOpciones?.some(g => g.opciones?.length) && !opcionesRaw.opciones?.length)) {
        setToast({
            type: 'error',
            title: 'Error de Carga',
            message: 'No hay opciones para ordenar.'
        });

        return [];
    }

    const grupo = (opcionesRaw.grupoOpciones || [])
        .filter(g => g.opciones?.length)
        .map(g => ({
            ...g,
            opciones: [...g.opciones].sort((a, b) => a.orden - b.orden)
        }));

    const opciones = opcionesRaw.opciones || [];

    return [...grupo, ...opciones].sort((a, b) => a.orden - b.orden);
  }

  const generarFragmentoOpcionSuelta = (item) => {
    return (
      <NavLink
        key={item.ruta}
        to={item.ruta}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        title={isCollapsed ? item.nombre : ''}
      >
        <span className='nav-icon'>
          <i data-lucide={item.icono}></i>
        </span>
        {!isCollapsed && <span className="nav-title">{item.nombre}</span>}
        <span className="active-indicator"></span>
      </NavLink>
    );
  }

  const generarFragmentoGrupoOpciones = (item) => {
    const isSubmenuOpen = openSubmenu === item.codigo;
    const isCategoryActive = item.opciones.some(sub => sub.ruta === location.pathname);
    const isExpanded = isSubmenuOpen || isCategoryActive;

    return (
      <div key={item.codigo} className={`nav-item-group ${isExpanded ? 'open' : ''}`}>
        <div
          className={`nav-item has-submenu ${isCategoryActive ? 'category-active' : ''}`}
          onClick={() => toggleSubmenu(item.codigo)}
          title={isCollapsed ? item.nombre : ''}
        >
          <span className='nav-icon'>
            <i data-lucide={item.icono}></i>
          </span>
          {!isCollapsed && (
            <>
              <span className="nav-title">{item.nombre}</span>
              <svg
                className={`chevron-icon ${isExpanded ? 'rotate' : ''}`}
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
          <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
            <div className="submenu-list">
              {item.opciones.map(sub => (
                <NavLink
                  key={sub.ruta}
                  to={sub.ruta}
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                >
                  {/* <span className="submenu-dot"></span> */}
                  <i data-lucide={sub.icono} className='nav-sub-icon'></i>
                  <span className="submenu-title">{sub.nombre}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const filterMenu = (listaOpciones) => listaOpciones
    .map(group => {
      if (!group.opciones) {
        const tieneAcceso = tienePermisoRuta(group.ruta);
        return tieneAcceso ? group : null;
      }
      const submenusPermitidos = group.opciones.filter(sub => tienePermisoRuta(sub.ruta));
      if (submenusPermitidos.length > 0) {
        return { ...group, opciones: submenusPermitidos };
      }
      return null;
    })
    .filter(Boolean);

  useEffect(() => {
    const activeGroup = opcionesSidebar.find(item =>
      item.opciones?.some(sub => sub.ruta === location.pathname)
    );
    if (activeGroup) {
      setOpenSubmenu(activeGroup.codigo);
    }
  }, [location.pathname]);

  useEffect(() => {
    cargarOpcionesSidebar();
  }, []);

  // useEffect(() => {
  //   console.log(opcionesSidebar);
  // }, [opcionesSidebar]);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [opcionesSidebar]);

  //#endregion

  const menuMasterConfig = [
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
      path: '/admin/dashboard'
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
      submenu: [
        { title: 'Mesas y Salón', path: '/admin/mesas' },
        { title: 'Reservas', path: '/admin/reservas' }
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
      submenu: [
        { title: 'Control de Caja (POS)', path: '/admin/caja' },
        { title: 'Caja General', path: '/admin/caja-general' },
        { title: 'Pagos Digitales', path: '/admin/pagos-digitales' }
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
      submenu: [
        { title: 'Gestión de Productos', path: '/admin/productos' },
        { title: 'Ajuste de Precios', path: '/admin/productos-ajuste' }
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
      submenu: [
        { title: 'Gestión de Usuarios', path: '/admin/usuarios' },
        { title: 'Roles y Permisos', path: '/admin/perfiles' },
        { title: 'Gestión de Empleados', path: '/admin/empleados' },
        { title: 'Gestión de Clientes', path: '/admin/clientes' },
        { title: 'Auditoría', path: '/admin/auditoria' },
      ]
    },
    {
      title: 'Mi Perfil',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      path: '/admin/perfil'
    }
  ];

  const tienePermisoRuta = (pathConfig) => {
    if (esAdminAbsoluto) return true;
    if (!pathConfig) return false;
    if (pathConfig === '/admin/perfil') return true;

    if (rolUpper.includes('MESERO') || rolUpper.includes('MOZO')) {
      if (pathConfig === '/admin/mesas' || pathConfig === '/admin/reservas') return true;
    }
    if (rolUpper.includes('CAJA') || rolUpper.includes('CAJERO')) {
      if (pathConfig.includes('/caja')) return true;
    }

    const pathLimpio = pathConfig.replace(/^\/admin/, '');
    return rutasHabilitadas.some(rutaBD => {
      if (!rutaBD) return false;
      const rutaBDLimpia = rutaBD.replace(/^\/admin/, '');
      return rutaBD === pathConfig || rutaBDLimpia === pathLimpio;
    });
  };

  // const filteredMenu = menuMasterConfig
  //   .map(group => {
  //     if (!group.submenu) {
  //       const tieneAcceso = tienePermisoRuta(group.path);
  //       return tieneAcceso ? group : null;
  //     }
  //     const submenusPermitidos = group.submenu.filter(sub => tienePermisoRuta(sub.path));
  //     if (submenusPermitidos.length > 0) {
  //       return { ...group, submenu: submenusPermitidos };
  //     }
  //     return null;
  //   })
  //   .filter(Boolean);

  const [openSubmenu, setOpenSubmenu] = useState(null);

  // useEffect(() => {
  //   const activeGroup = filteredMenu.find(item =>
  //     item.submenu?.some(sub => sub.path === location.pathname)
  //   );
  //   if (activeGroup) {
  //     setOpenSubmenu(activeGroup.key);
  //   }
  // }, [location.pathname]);

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenu(prevKey => (prevKey === menuKey ? null : menuKey));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-wrapper">
          <div className="brand-logo-circle">
            <img src={logoImage} alt="SRA MILLONES Logo" className="sidebar-brand-img" />
          </div>
          <span className="logo-glow"></span>
        </div>

        {!isCollapsed && (
          <div className="brand-info">
            <span className="brand-name">SRA MILLONES</span>
            <div className="brand-badge-pill">
              <span className="badge-pulse"></span>
              <span className="brand-badge-text">{user?.rol || 'SIN ROL'}</span>
            </div>
          </div>
        )}
      </div>

      <nav className='sidebar-nav'>
        {
          opcionesSidebar.map(item => {
            if (!item.opciones) return generarFragmentoOpcionSuelta(item);
            return generarFragmentoGrupoOpciones(item);
          })
        }
      </nav>

      {/* <nav className="sidebar-nav">
        {filteredMenu.map(item => {
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
          const isCategoryActive = item.submenu.some(sub => sub.path === location.pathname);
          const isExpanded = isSubmenuOpen || isCategoryActive;

          return (
            <div key={item.key} className={`nav-item-group ${isExpanded ? 'open' : ''}`}>
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
                      className={`chevron-icon ${isExpanded ? 'rotate' : ''}`}
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
                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="submenu-list">
                    {item.submenu.map(sub => (
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
      </nav> */}

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