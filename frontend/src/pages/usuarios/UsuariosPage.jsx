import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon } from '../../components/common/Icons';
import './UsuariosPage.css';

export const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Estados para Modal de Registro / Edición
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  // Estados para Modal de Ver Detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [usuarioVer, setUsuarioVer] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    rol: 'Cocinero frío',
    password: ''
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  const [usuarios, setUsuarios] = useState([
    { id: 9, username: 'superadmin', rol: 'SUPER_ADMIN', email: 'superadmin@lajama.com', estado: 'Activo' },
    { id: 11, username: 'CocineroFrio', rol: 'Cocinero frío', email: 'cocineroF@gmail.com', estado: 'Activo' },
    { id: 12, username: 'CocineroCaliente', rol: 'Cocinero Caliente', email: 'cocineroC@gmail.com', estado: 'Activo' },
    { id: 13, username: 'Mesero', rol: 'Mesero', email: 'mesero@gmail.com', estado: 'Activo' }
  ]);

  const ROLES_SISTEMA = [
    'SUPER_ADMIN',
    'Administrador',
    'Cajero',
    'Cocinero frío',
    'Cocinero Caliente',
    'Mesero'
  ];

  const COLUMNAS_USUARIOS = [
    { header: 'ID', width: '70px' },
    { header: 'USUARIO' },
    { header: 'PERFIL / ROL' },
    { header: 'CORREO ELECTRÓNICO' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '160px', align: 'center' }
  ];

  const usuariosFiltrados = usuarios.filter(u => {
    const txt = searchTerm.toLowerCase();
    return u.username.toLowerCase().includes(txt) ||
           u.email.toLowerCase().includes(txt) ||
           u.rol.toLowerCase().includes(txt);
  });

  const handleAbrirNuevo = () => {
    setUsuarioEditar(null);
    setFormData({ username: '', email: '', rol: 'Cocinero frío', password: '' });
    setShowModal(true);
  };

  const handleAbrirEditar = (user) => {
    setUsuarioEditar(user);
    setFormData({ username: user.username, email: user.email, rol: user.rol, password: '' });
    setShowModal(true);
  };

  const handleAbrirDetalle = (user) => {
    setUsuarioVer(user);
    setShowDetalleModal(true);
  };

  const handleEliminar = (id, username) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja a "${username}"?`,
      message: 'El usuario perderá el acceso al sistema de inmediato, conservando sus registros en el historial.',
      type: 'warning',
      onConfirm: () => {
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, estado: 'Inactivo' } : u));
        setToast({ type: 'info', title: 'Usuario Desactivado', message: `El usuario "${username}" ha sido desactivado.` });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleGuardarUsuario = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      setToast({ type: 'error', title: 'Campos requeridos', message: 'Por favor complete el nombre de usuario y correo electrónico.' });
      return;
    }

    if (usuarioEditar) {
      setUsuarios(usuarios.map(u => u.id === usuarioEditar.id ? { ...u, ...formData } : u));
      setToast({ type: 'info', title: 'Usuario Actualizado', message: `Los datos de "${formData.username}" fueron guardados exitosamente.` });
    } else {
      const nuevo = { id: Date.now(), ...formData, estado: 'Activo' };
      setUsuarios([nuevo, ...usuarios]);
      setToast({ type: 'info', title: '¡Usuario Creado!', message: `El usuario "${formData.username}" fue registrado en el sistema.` });
    }

    setShowModal(false);
  };

  return (
    <div className="usuarios-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE UNIVERSAL CON EL ÍCONO JUNTO AL TÍTULO */}
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
        emptyMessage="No se encontraron usuarios coincidentes."
        renderRow={(user) => (
          <tr key={user.id} className={user.estado === 'Inactivo' ? 'tr-disabled' : ''}>
            <td><span className="usuario-id-bold">{user.id}</span></td>
            <td><span className="usuario-name">{user.username}</span></td>
            <td><span className="usuario-rol-text">{user.rol}</span></td>
            <td><span className="usuario-email-text">{user.email}</span></td>
            <td>
              <span className={`badge-estado-pill ${user.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                {user.estado}
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
                  onClick={() => handleEliminar(user.id, user.username)}
                >
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
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
                  placeholder="ejemplo@lajama.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">PERFIL / ROL DE ACCESO *</label>
                <select
                  className="input-senior select-senior"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  {ROLES_SISTEMA.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">CONTRASEÑA DE SEGURIDAD</label>
                <input
                  type="password"
                  className="input-senior"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        title={usuarioVer ? `Detalle de Usuario: ${usuarioVer.username}` : 'Detalle de Usuario'}
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
                <span className="detalle-val">{usuarioVer.username}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Rol / Cargo:</span>
                <span className="detalle-val badge-rol">{usuarioVer.rol}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Correo Electrónico:</span>
                <span className="detalle-val">{usuarioVer.email}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado de Acceso:</span>
                <span className={`badge-estado-pill ${usuarioVer.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                  {usuarioVer.estado}
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
        confirmText="Sí, Dar de Baja"
        cancelText="Conservar Activo"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UsuariosPage;