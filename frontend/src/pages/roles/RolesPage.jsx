import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon, KeyIcon } from '../../components/common/Icons';
import perfilService from '../../services/perfilService';
import './RolesPage.css';

export const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados provenientes de la BD Spring Boot
  const [roles, setRoles] = useState([]);
  const [modulosSistema, setModulosSistema] = useState([]);

  // Estados para Modales
  const [showRolModal, setShowRolModal] = useState(false);
  const [rolEditar, setRolEditar] = useState(null);

  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [rolPermisos, setRolPermisos] = useState(null);
  const [opcionesSeleccionadasIds, setOpcionesSeleccionadasIds] = useState([]);

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

  const COLUMNAS_ROLES = [
    { header: 'ID', width: '70px' },
    { header: 'NOMBRE DEL ROL', width: '200px' },
    { header: 'DESCRIPCIÓN OPERATIVA' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '180px', align: 'center' }
  ];

  // 1. Cargar datos iniciales de la API
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resPerfiles, resOpciones] = await Promise.all([
        perfilService.listar(),
        perfilService.listarOpciones()
      ]);

      if (resPerfiles && resPerfiles.success) {
        setRoles(resPerfiles.data || []);
      }

      if (resOpciones && resOpciones.success) {
        setModulosSistema(resOpciones.data || []);
      }
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudieron recuperar los perfiles y permisos desde el servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const rolesFiltrados = roles.filter(r => {
    const txt = searchTerm.toLowerCase();
    return (r.nombre || '').toLowerCase().includes(txt) ||
           (r.descripcion || '').toLowerCase().includes(txt);
  });

  // Modal Crear Rol
  const handleAbrirNuevo = () => {
    setRolEditar(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowRolModal(true);
  };

  // Modal Editar Rol
  const handleAbrirEditar = (rol) => {
    setRolEditar(rol);
    setFormData({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
    setShowRolModal(true);
  };

  // Modal Asignar Permisos (Key/Llave)
  const handleAbrirPermisos = async (rol) => {
    try {
      const res = await perfilService.obtenerPorId(rol.id);
      if (res && res.success) {
        const perfilDetalle = res.data;
        setRolPermisos(perfilDetalle);
        const idsActuales = (perfilDetalle.opciones || []).map(op => op.id);
        setOpcionesSeleccionadasIds(idsActuales);
        setShowPermisosModal(true);
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los permisos del rol.' });
    }
  };

  // Modal Ver Detalle
  const handleAbrirDetalle = async (rol) => {
    try {
      const res = await perfilService.obtenerPorId(rol.id);
      if (res && res.success) {
        setRolVer(res.data);
      } else {
        setRolVer(rol);
      }
    } catch (err) {
      setRolVer(rol);
    }
    setShowDetalleModal(true);
  };

  // Checkbox Permisos Toggle
  const handleTogglePermiso = (opcionId) => {
    setOpcionesSeleccionadasIds(prev =>
      prev.includes(opcionId)
        ? prev.filter(id => id !== opcionId)
        : [...prev, opcionId]
    );
  };

  // Guardar Permisos de un Rol
  const handleGuardarPermisos = async (e) => {
    e.preventDefault();
    if (!rolPermisos) return;

    const payload = {
      id: rolPermisos.id,
      nombre: rolPermisos.nombre,
      descripcion: rolPermisos.descripcion,
      opciones: opcionesSeleccionadasIds.map(id => ({ id }))
    };

    try {
      const res = await perfilService.guardar(payload);
      if (res.success) {
        setToast({
          type: 'info',
          title: 'Permisos Actualizados',
          message: `Se actualizaron los permisos para el rol "${rolPermisos.nombre}".`
        });
        setShowPermisosModal(false);
        cargarDatos();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al actualizar los permisos.';
      setToast({ type: 'error', title: 'Error', message: errMsg });
    }
  };

  // Desactivar o Eliminar Rol
  const handleEliminar = (id, nombre) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja el rol "${nombre}"?`,
      message: 'Los usuarios con este perfil asignado perderán sus accesos asociados de inmediato.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await perfilService.cambiarEstado(id);
          if (res.success) {
            setToast({ type: 'info', title: 'Estado Actualizado', message: res.message });
            cargarDatos();
          }
        } catch (err) {
          const errMsg = err.response?.data?.message || 'No se pudo cambiar el estado del perfil.';
          setToast({ type: 'error', title: 'Operación Rechazada', message: errMsg });
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Guardar o Editar Datos de Rol
  const handleGuardarRol = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setToast({ type: 'error', title: 'Campo Requerido', message: 'Escriba el nombre del rol.' });
      return;
    }

    const payload = {
      id: rolEditar ? rolEditar.id : null,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      opciones: rolEditar && rolEditar.opciones ? rolEditar.opciones : []
    };

    try {
      const res = await perfilService.guardar(payload);
      if (res.success) {
        setToast({
          type: 'info',
          title: rolEditar ? 'Rol Actualizado' : '¡Rol Registrado!',
          message: res.message
        });
        setShowRolModal(false);
        cargarDatos();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al guardar el rol.';
      setToast({ type: 'error', title: 'Error al Guardar', message: errMsg });
    }
  };

  return (
    <div className="roles-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE ROLES */}
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
        emptyMessage={loading ? "Cargando roles del sistema..." : "No se encontraron roles coincidentes."}
        renderRow={(rol) => {
          const esActivo = rol.estado === 1 || rol.estado === 'Activo';

          return (
            <tr key={rol.id} className={!esActivo ? 'tr-disabled' : ''}>
              <td><span className="rol-id-bold">#{rol.id}</span></td>
              <td><span className="rol-nombre-text">{rol.nombre}</span></td>
              <td><span className="rol-descripcion-text">{rol.descripcion || 'Sin descripción'}</span></td>
              <td>
                <span className={`badge-estado-pill ${esActivo ? 'activo' : 'inactivo'}`}>
                  {esActivo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="acciones-buttons-group">
                  <button className="btn-action-icon edit" title="Editar datos del rol" onClick={() => handleAbrirEditar(rol)}>
                    <EditIcon />
                  </button>
                  <button className="btn-action-icon key" title="Asignar permisos del sistema" onClick={() => handleAbrirPermisos(rol)}>
                    <KeyIcon />
                  </button>
                  <button className="btn-action-icon view" title="Ver detalle del rol" onClick={() => handleAbrirDetalle(rol)}>
                    <EyeIcon />
                  </button>
                  <button className="btn-action-icon delete" title="Cambiar estado del rol" onClick={() => handleEliminar(rol.id, rol.nombre)}>
                    <HideIcon />
                  </button>
                </div>
              </td>
            </tr>
          );
        }}
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

      {/* MODAL 2: ASIGNAR PERMISOS / MÓDULOS DEL SISTEMA */}
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
            <div className="permisos-warning-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="permisos-alert-icon">
                <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V10h2v2z"/>
              </svg>
              <div className="permisos-warning-content">
                <p>Seleccione los módulos operativos a los que tendrá acceso el perfil:</p>
                <h4 className="rol-destacado-title">{rolPermisos?.nombre}</h4>
              </div>
            </div>

            <div className="modulos-checklist-container">
              {modulosSistema.map((modulo) => {
                const isChecked = opcionesSeleccionadasIds.includes(modulo.id);
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
                <span className="detalle-val">{rolVer.descripcion || 'Sin descripción'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`badge-estado-pill ${(rolVer.estado === 1 || rolVer.estado === 'Activo') ? 'activo' : 'inactivo'}`}>
                  {(rolVer.estado === 1 || rolVer.estado === 'Activo') ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="detalle-row flex-col">
                <span className="detalle-label">Permisos Habilitados ({rolVer.opciones?.length || 0}):</span>
                <div className="permisos-pills-wrap">
                  {rolVer.opciones?.map(op => (
                    <span key={op.id} className="badge-permiso-pill">
                      {op.nombre}
                    </span>
                  ))}
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
        confirmText="Sí, Cambiar Estado"
        cancelText="Conservar Estado"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default RolesPage;