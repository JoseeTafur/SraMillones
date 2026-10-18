import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon, KeyIcon, PlusIcon } from '../../components/common/Icons';
import './RolesPage.css';

export const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Estados para Modales
  const [showRolModal, setShowRolModal] = useState(false);
  const [rolEditar, setRolEditar] = useState(null);

  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [rolPermisos, setRolPermisos] = useState(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [rolVer, setRolVer] = useState(null);

  // Formulario Rol
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  // Estado para ConfirmDialog
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Lista de Módulos Operativos del Sistema La Jama
  const MODULOS_SISTEMA = [
    { id: 'dashboard', nombre: 'Dashboard' },
    { id: 'usuarios', nombre: 'Usuarios' },
    { id: 'perfiles', nombre: 'Perfiles' },
    { id: 'empleados', nombre: 'Empleados' },
    { id: 'caja', nombre: 'Control de Caja' },
    { id: 'cocina_caliente', nombre: 'Cocina Caliente' },
    { id: 'despacho', nombre: 'Monitor Despacho' },
    { id: 'cocina_fria', nombre: 'Cocina Fría' },
    { id: 'productos', nombre: 'Productos y Carta' },
    { id: 'precios', nombre: 'Gestión de Precios' }
  ];

  // Lista simulada de Roles
  const [roles, setRoles] = useState([
    {
      id: 1,
      nombre: 'Administrador',
      descripcion: 'Control total sobre el sistema',
      estado: 'Activo',
      permisos: ['dashboard', 'usuarios', 'perfiles', 'empleados', 'caja', 'cocina_caliente', 'despacho', 'cocina_fria', 'productos', 'precios']
    },
    {
      id: 2,
      nombre: 'Visitante',
      descripcion: 'Solo tiene permiso al Dashboard',
      estado: 'Activo',
      permisos: ['dashboard']
    },
    {
      id: 3,
      nombre: 'Empleado',
      descripcion: 'Se le asignará el cargo dependiendo de su rol',
      estado: 'Activo',
      permisos: ['dashboard', 'despacho']
    },
    {
      id: 4,
      nombre: 'Cajero',
      descripcion: 'Acceso a caja, despacho, delivery y productos',
      estado: 'Activo',
      permisos: ['dashboard', 'caja', 'despacho', 'productos']
    }
  ]);

  const COLUMNAS_ROLES = [
    { header: 'ID', width: '70px' },
    { header: 'NOMBRE DEL ROL', width: '180px' },
    { header: 'DESCRIPCIÓN OPERATIVA' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '180px', align: 'center' }
  ];

  const rolesFiltrados = roles.filter(r => {
    const txt = searchTerm.toLowerCase();
    return r.nombre.toLowerCase().includes(txt) || r.descripcion.toLowerCase().includes(txt);
  });

  // Abrir Modal Crear Rol
  const handleAbrirNuevo = () => {
    setRolEditar(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowRolModal(true);
  };

  // Abrir Modal Editar Rol
  const handleAbrirEditar = (rol) => {
    setRolEditar(rol);
    setFormData({ nombre: rol.nombre, descripcion: rol.descripcion });
    setShowRolModal(true);
  };

  // Abrir Modal Asignar Permisos (Llave)
  const handleAbrirPermisos = (rol) => {
    setRolPermisos(rol);
    setPermisosSeleccionados(rol.permisos || []);
    setShowPermisosModal(true);
  };

  // Abrir Modal Ver Detalle
  const handleAbrirDetalle = (rol) => {
    setRolVer(rol);
    setShowDetalleModal(true);
  };

  // Toggle Checkbox Permisos
  const handleTogglePermiso = (moduloId) => {
    setPermisosSeleccionados(prev =>
      prev.includes(moduloId)
        ? prev.filter(id => id !== moduloId)
        : [...prev, moduloId]
    );
  };

  // Guardar Permisos
  const handleGuardarPermisos = (e) => {
    e.preventDefault();
    setRoles(prev => prev.map(r => r.id === rolPermisos.id ? { ...r, permisos: permisosSeleccionados } : r));
    setToast({
      type: 'info',
      title: 'Permisos Actualizados',
      message: `Se actualizaron los permisos para el rol "${rolPermisos.nombre}".`
    });
    setShowPermisosModal(false);
  };

  // Dar de Baja Rol
  const handleEliminar = (id, nombre) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja el rol "${nombre}"?`,
      message: 'Los usuarios con este perfil asignado perderán sus accesos asociados de inmediato.',
      type: 'warning',
      onConfirm: () => {
        setRoles(prev => prev.map(r => r.id === id ? { ...r, estado: 'Inactivo' } : r));
        setToast({ type: 'info', title: 'Rol Desactivado', message: `El rol "${nombre}" ha sido desactivado.` });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Guardar Rol (Nuevo o Editar)
  const handleGuardarRol = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setToast({ type: 'error', title: 'Campo Requerido', message: 'Escriba el nombre del rol.' });
      return;
    }

    if (rolEditar) {
      setRoles(roles.map(r => r.id === rolEditar.id ? { ...r, ...formData } : r));
      setToast({ type: 'info', title: 'Rol Actualizado', message: `Se actualizaron los datos del rol "${formData.nombre}".` });
    } else {
      const nuevo = {
        id: Date.now(),
        ...formData,
        estado: 'Activo',
        permisos: ['dashboard']
      };
      setRoles([nuevo, ...roles]);
      setToast({ type: 'info', title: '¡Rol Registrado!', message: `El rol "${formData.nombre}" fue registrado correctamente.` });
    }

    setShowRolModal(false);
  };

  return (
    <div className="roles-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE UNIVERSAL DE ROLES */}
      <DataTable
        title="Lista de Roles del Sistema"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        }
        actionButtonText="Nuevo Registro"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o descripción..."
        columns={COLUMNAS_ROLES}
        data={rolesFiltrados}
        itemsPerPage={5}
        emptyMessage="No se encontraron roles coincidentes."
        renderRow={(rol) => (
          <tr key={rol.id} className={rol.estado === 'Inactivo' ? 'tr-disabled' : ''}>
            <td><span className="rol-id-bold">{rol.id}</span></td>
            <td><span className="rol-nombre-text">{rol.nombre}</span></td>
            <td><span className="rol-descripcion-text">{rol.descripcion}</span></td>
            <td>
              <span className={`badge-estado-pill ${rol.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                {rol.estado}
              </span>
            </td>
            <td>
              <div className="acciones-buttons-group">
                {/* 1. Editar Rol (Cuadrado Naranja) */}
                <button className="btn-action-icon edit" title="Editar datos del rol" onClick={() => handleAbrirEditar(rol)}>
                  <EditIcon />
                </button>

                {/* 2. Asignar Permisos (Cuadrado Gris / Llave) */}
                <button className="btn-action-icon key" title="Asignar permisos del sistema" onClick={() => handleAbrirPermisos(rol)}>
                  <KeyIcon />
                </button>

                {/* 3. Ver Detalle (Cuadrado Verde / Ojo) */}
                <button className="btn-action-icon view" title="Ver detalle del rol" onClick={() => handleAbrirDetalle(rol)}>
                  <EyeIcon />
                </button>

                {/* 4. Dar de Baja (Cuadrado Rojo / Ojo Ocultar) */}
                <button className="btn-action-icon delete" title="Dar de baja rol" onClick={() => handleEliminar(rol.id, rol.nombre)}>
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* MODAL 1: REGISTRAR / EDITAR ROL */}
      <Modal
        isOpen={showRolModal}
        onClose={() => setShowRolModal(false)}
        title={rolEditar ? 'Editar Rol' : 'Nuevo Registro de Rol'}
        maxWidth="540px"
      >
        <form onSubmit={handleGuardarRol}>
          <div className="modal-body-custom compact">
            <div className="form-group-custom">
              <label className="label-senior">1. Nombre del Rol *</label>
              <input
                type="text"
                required
                className="input-senior"
                placeholder="Ej. Cajero, Administrador, Cocinero"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="form-group-custom">
              <label className="label-senior">2. Descripción Operativa</label>
              <textarea
                rows="3"
                className="input-senior textarea-senior"
                placeholder="Describa brevemente las funciones o accesos principales..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowRolModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ASIGNAR PERMISOS DEL SISTEMA (FIDELIDAD CAPTURA) */}
      <Modal
        isOpen={showPermisosModal}
        onClose={() => setShowPermisosModal(false)}
        title="Asignar Permisos del Sistema"
        maxWidth="520px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        }
      >
        <form onSubmit={handleGuardarPermisos}>
          <div className="modal-body-custom permisos-modal-body">
            {/* Caja Informativa Dorada con Nombre del Rol */}
            <div className="permisos-warning-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="permisos-alert-icon">
                <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V10h2v2z"/>
              </svg>
              <div className="permisos-warning-content">
                <p>Seleccione los módulos operativos a los que tendrá acceso comercial el perfil:</p>
                <h4 className="rol-destacado-title">{rolPermisos?.nombre}</h4>
              </div>
            </div>

            {/* Lista de Checkboxes de Módulos Operativos */}
            <div className="modulos-checklist-container">
              {MODULOS_SISTEMA.map((modulo) => {
                const isChecked = permisosSeleccionados.includes(modulo.id);
                return (
                  <label key={modulo.id} className={`modulo-check-row ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermiso(modulo.id)}
                      className="checkbox-senior-item"
                    />
                    <span className="modulo-nombre">{modulo.nombre}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowPermisosModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VER DETALLE DEL ROL */}
      <Modal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        title={rolVer ? `Detalle de Rol: ${rolVer.nombre}` : 'Detalle de Rol'}
        maxWidth="500px"
      >
        {rolVer && (
          <div className="modal-body-custom compact">
            <div className="usuario-detalle-card">
              <div className="detalle-row">
                <span className="detalle-label">ID de Registro:</span>
                <span className="detalle-val font-bold">#{rolVer.id}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Nombre del Rol:</span>
                <span className="detalle-val">{rolVer.nombre}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Descripción:</span>
                <span className="detalle-val">{rolVer.descripcion}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`badge-estado-pill ${rolVer.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                  {rolVer.estado}
                </span>
              </div>
              <div className="detalle-row flex-col">
                <span className="detalle-label">Permisos Habilitados ({rolVer.permisos?.length || 0}):</span>
                <div className="permisos-pills-wrap">
                  {rolVer.permisos?.map(pId => {
                    const mod = MODULOS_SISTEMA.find(m => m.id === pId);
                    return (
                      <span key={pId} className="badge-permiso-pill">
                        {mod ? mod.nombre : pId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-save-senior" onClick={() => setShowDetalleModal(false)}>
            Entendido
          </button>
        </div>
      </Modal>

      {/* CONFIRMDIALOG */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText="Sí, Dar de Baja"
        cancelText="Conservar Activo"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default RolesPage;