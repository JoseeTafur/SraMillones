import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon } from '../../components/common/Icons';
import usuarioService from '../../services/usuarioService';
import './UsuariosPage.css';

export const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lista de usuarios y perfiles
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [usuarioVer, setUsuarioVer] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    perfilId: '',
    password: ''
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  const COLUMNAS_USUARIOS = [
    { header: 'ID', width: '70px' },
    { header: 'USUARIO' },
    { header: 'PERFIL / ROL' },
    { header: 'CORREO ELECTRÓNICO' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '160px', align: 'center' }
  ];

  // 1. Cargar Usuarios y Perfiles (Ejecución única y protegida)
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resUsuarios = await usuarioService.listar();
      if (resUsuarios && resUsuarios.success) {
        setUsuarios(resUsuarios.data || []);
      }

      // Consulta de perfiles segura
      let resPerfiles;
      if (typeof usuarioService.listarPerfiles === 'function') {
        resPerfiles = await usuarioService.listarPerfiles();
      } else {
        resPerfiles = await usuarioService.obtenerPerfiles ? await usuarioService.obtenerPerfiles() : null;
      }

      if (resPerfiles && resPerfiles.success) {
        setPerfiles(resPerfiles.data || []);
      }
    } catch (error) {
      console.error("Error al cargar lista de usuarios:", error);
      setToast({
        type: 'error',
        title: 'Error de Carga',
        message: 'No se pudieron recuperar los usuarios. Asegúrese de haber iniciado sesión.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Se ejecuta ÚNICAMENTE 1 vez al cargar la vista
  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosFiltrados = usuarios.filter(u => {
    const txt = searchTerm.toLowerCase();
    const nombreUser = (u.usuario || u.username || '').toLowerCase();
    const correoUser = (u.correo || u.email || '').toLowerCase();
    const perfilUser = (u.perfil?.nombre || u.rol || '').toLowerCase();

    return nombreUser.includes(txt) || correoUser.includes(txt) || perfilUser.includes(txt);
  });

  const handleAbrirNuevo = () => {
    setUsuarioEditar(null);
    const primerPerfilId = perfiles.length > 0 ? perfiles[0].id : '';
    setFormData({ username: '', email: '', perfilId: primerPerfilId, password: '' });
    setShowModal(true);
  };

  const handleAbrirEditar = (user) => {
    setUsuarioEditar(user);
    setFormData({
      username: user.usuario || user.username || '',
      email: user.correo || user.email || '',
      perfilId: user.perfil ? user.perfil.id : '',
      password: ''
    });
    setShowModal(true);
  };

  const handleAbrirDetalle = (user) => {
    setUsuarioVer(user);
    setShowDetalleModal(true);
  };

  // 2. Desactivar / Cambiar estado con confirmación
  const handleEliminar = (id, username) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja a "${username}"?`,
      message: 'El usuario perderá el acceso al sistema de inmediato.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await usuarioService.cambiarEstado(id);
          if (res && res.success) {
            setToast({ type: 'info', title: 'Estado Actualizado', message: res.message });
            cargarDatos();
          }
        } catch (err) {
          const errMsg = err.response?.data?.message || 'No se pudo cambiar el estado del usuario.';
          setToast({ type: 'error', title: 'Operación Rechazada', message: errMsg });
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 3. Guardar o Actualizar Usuario
  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      setToast({ type: 'error', title: 'Campos requeridos', message: 'Por favor complete el usuario y correo electrónico.' });
      return;
    }

    const payload = {
      id: usuarioEditar ? usuarioEditar.id : null,
      usuario: formData.username.trim(),
      correo: formData.email.trim(),
      clave: formData.password ? formData.password.trim() : null,
      perfil: formData.perfilId ? { id: parseInt(formData.perfilId) } : null
    };

    try {
      const res = await usuarioService.guardar(payload);
      if (res && res.success) {
        setToast({
          type: 'info',
          title: usuarioEditar ? 'Usuario Actualizado' : '¡Usuario Creado!',
          message: res.message
        });
        setShowModal(false);
        cargarDatos();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al guardar el usuario en el servidor.';
      setToast({ type: 'error', title: 'Error al Guardar', message: errMsg });
    }
  };

  return (
    <div className="usuarios-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE UNIVERSAL */}
      <DataTable
        title="Usuarios del Sistema"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        }
        actionButtonText="Nuevo Registro"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por usuario, correo o rol..."
        columns={COLUMNAS_USUARIOS}
        data={usuariosFiltrados}
        itemsPerPage={5}
        emptyMessage={loading ? "Cargando usuarios..." : "No se encontraron usuarios coincidentes."}
        renderRow={(user) => {
          const esActivo = user.estado === 1 || user.estado === 'Activo';
          const nombreUser = user.usuario || user.username;
          const correoUser = user.correo || user.email;
          const rolUser = user.perfil ? user.perfil.nombre : (user.rol || 'Sin Perfil');

          return (
            <tr key={user.id} className={!esActivo ? 'tr-disabled' : ''}>
              <td><span className="usuario-id-bold">#{user.id}</span></td>
              <td><span className="usuario-name">{nombreUser}</span></td>
              <td><span className="usuario-rol-text">{rolUser}</span></td>
              <td><span className="usuario-email-text">{correoUser}</span></td>
              <td>
                <span className={`badge-estado-pill ${esActivo ? 'activo' : 'inactivo'}`}>
                  {esActivo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="acciones-buttons-group">
                  <button
                    className="btn-action-icon edit"
                    title="Editar usuario"
                    onClick={() => handleAbrirEditar(user)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="btn-action-icon view"
                    title="Ver detalle de usuario"
                    onClick={() => handleAbrirDetalle(user)}
                  >
                    <EyeIcon />
                  </button>
                  <button
                    className="btn-action-icon delete"
                    title="Dar de baja usuario"
                    onClick={() => handleEliminar(user.id, nombreUser)}
                  >
                    <HideIcon />
                  </button>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* MODAL REGISTRAR / EDITAR */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={usuarioEditar ? 'Editar Usuario' : 'Agregar Usuario'}
        maxWidth="680px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        }
      >
        <form onSubmit={handleGuardarUsuario}>
          <div className="modal-body-custom usuarios-form-body">
            <div className="usuarios-grid-2col">
              <div className="form-group-custom">
                <label className="label-senior">NOMBRE DE USUARIO (LOGIN) *</label>
                <input
                  type="text"
                  required
                  className="input-senior"
                  placeholder="Ej. juan.perez"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">CORREO ELECTRÓNICO *</label>
                <input
                  type="email"
                  required
                  className="input-senior"
                  placeholder="ejemplo@sramillones.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">PERFIL / ROL DE ACCESO *</label>
                <select
                  className="input-senior select-senior"
                  value={formData.perfilId}
                  onChange={(e) => setFormData({ ...formData, perfilId: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar Perfil --</option>
                  {perfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">CONTRASEÑA DE SEGURIDAD</label>
                <input
                  type="password"
                  className="input-senior"
                  placeholder={usuarioEditar ? "Dejar en blanco para conservar" : "Mínimo 6 caracteres"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!usuarioEditar}
                />
              </div>
            </div>

            <div className="security-note-box">
              <p>
                <strong>Nota de seguridad:</strong> Si está editando un usuario existente, deje el campo de contraseña completamente en blanco si no desea modificar la clave actual.
              </p>
            </div>
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETALLE */}
      <Modal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        title={usuarioVer ? `Detalle de Usuario: ${usuarioVer.usuario || usuarioVer.username}` : 'Detalle de Usuario'}
        maxWidth="520px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        }
      >
        {usuarioVer && (
          <div className="modal-body-custom compact">
            <div className="usuario-detalle-card">
              <div className="detalle-row">
                <span className="detalle-label">ID de Registro:</span>
                <span className="detalle-val font-bold">#{usuarioVer.id}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Nombre de Usuario:</span>
                <span className="detalle-val">{usuarioVer.usuario || usuarioVer.username}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Rol / Cargo:</span>
                <span className="detalle-val badge-rol">
                  {usuarioVer.perfil ? usuarioVer.perfil.nombre : (usuarioVer.rol || 'Sin Perfil')}
                </span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Correo Electrónico:</span>
                <span className="detalle-val">{usuarioVer.correo || usuarioVer.email}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado de Acceso:</span>
                <span className={`badge-estado-pill ${(usuarioVer.estado === 1 || usuarioVer.estado === 'Activo') ? 'activo' : 'inactivo'}`}>
                  {(usuarioVer.estado === 1 || usuarioVer.estado === 'Activo') ? 'Activo' : 'Inactivo'}
                </span>
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

export default UsuariosPage;