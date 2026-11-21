import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon } from '../../components/common/Icons';
import { clienteService } from '../../services/cliente.service';
import './ClientesPage.css';

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  correo: ''
};

const extraerLista = (res) => res?.data?.content ?? res?.data ?? [];

export const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', '1' activos, '0' inactivos
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [clienteVer, setClienteVer] = useState(null);

  const [formData, setFormData] = useState(FORM_VACIO);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {}
  });

  const COLUMNAS_CLIENTES = [
    { header: 'ID', width: '70px' },
    { header: 'APELLIDOS Y NOMBRES' },
    { header: 'DNI', width: '120px' },
    { header: 'TELÉFONO', width: '130px' },
    { header: 'CORREO' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '160px', align: 'center' }
  ];

  // Carga desde Spring Boot: GET /api/clientes?estado=&texto=
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await clienteService.buscar(filtroEstado, searchTerm.trim());
      if (res && res.success) setClientes(extraerLista(res));
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setToast({ type: 'error', title: 'Error de Red', message: 'No se pudieron obtener los clientes del servidor.' });
    } finally {
      setLoading(false);
    }
  };

  // Recarga al cambiar el estado o el texto (con pausa para no saturar el servidor)
  useEffect(() => {
    const t = setTimeout(cargarDatos, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, searchTerm]);

  const handleAbrirNuevo = () => {
    setClienteEditar(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleAbrirEditar = (cli) => {
    setClienteEditar(cli);
    setFormData({
      nombre: cli.nombre || '',
      apellido: cli.apellido || '',
      dni: cli.dni || '',
      telefono: cli.telefono || '',
      correo: cli.correo || ''
    });
    setShowModal(true);
  };

  const handleAbrirDetalle = (cli) => {
    setClienteVer(cli);
    setShowDetalleModal(true);
  };

  const handleAlternarEstado = (cli) => {
    const nombreCompleto = `${cli.apellido}, ${cli.nombre}`;
    const activo = cli.estado === 1;
    setConfirmState({
      isOpen: true,
      title: `¿${activo ? 'Desactivar' : 'Reactivar'} a "${nombreCompleto}"?`,
      message: activo
        ? 'El cliente quedará inactivo y no aparecerá en los registros activos.'
        : 'El cliente volverá a estar activo.',
      type: 'warning',
      confirmText: activo ? 'Sí, Desactivar' : 'Sí, Reactivar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const res = await clienteService.alternarEstado(cli.id);
          if (res && res.success) {
            setToast({ type: 'info', title: 'Estado actualizado', message: res.message });
            cargarDatos();
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Error al cambiar el estado.' });
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.dni.trim()) {
      setToast({ type: 'error', title: 'Campos requeridos', message: 'Por favor complete nombre, apellido y DNI.' });
      return;
    }

    // Coincide con ClienteSaveDTO(nombre, apellido, dni, telefono, correo)
    const payload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      dni: formData.dni.trim(),
      telefono: formData.telefono.trim(),
      correo: formData.correo.trim()
    };

    try {
      const res = clienteEditar
        ? await clienteService.actualizar(clienteEditar.id, payload)
        : await clienteService.crear(payload);

      if (res && res.success) {
        setToast({ type: 'info', title: 'Éxito', message: res.message });
        setShowModal(false);
        cargarDatos();
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error al Guardar', message: err.response?.data?.message || 'Error en el servidor.' });
    }
  };

  return (
    <div className="clientes-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <DataTable
        title="Gestión de Clientes"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        }
        actionButtonText="Nuevo Cliente"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, DNI o correo..."
        columns={COLUMNAS_CLIENTES}
        data={clientes}
        itemsPerPage={5}
        emptyMessage={loading ? 'Cargando clientes desde el servidor...' : 'No se encontraron clientes coincidentes.'}
        extraHeaderAction={
          <div className="selector-estado-header">
            <select
              className="select-estado-pill"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los clientes</option>
              <option value="1">Clientes activos</option>
              <option value="0">Clientes inactivos</option>
            </select>
          </div>
        }
        renderRow={(cli) => (
          <tr key={cli.id} className={cli.estado === 0 ? 'tr-disabled' : ''}>
            <td><span className="cli-id-bold">#{cli.id}</span></td>
            <td><span className="cli-nombre">{cli.apellido}, {cli.nombre}</span></td>
            <td><span className="cli-dni">{cli.dni}</span></td>
            <td><span className="cli-telefono">{cli.telefono || '—'}</span></td>
            <td><span className="cli-correo">{cli.correo || 'Sin correo'}</span></td>
            <td>
              <span className={`badge-estado-pill ${cli.estado === 1 ? 'activo' : 'inactivo'}`}>
                {cli.estado === 1 ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td>
              <div className="acciones-buttons-group">
                <button className="btn-action-icon edit" title="Editar cliente" onClick={() => handleAbrirEditar(cli)}>
                  <EditIcon />
                </button>
                <button className="btn-action-icon view" title="Ver detalle de cliente" onClick={() => handleAbrirDetalle(cli)}>
                  <EyeIcon />
                </button>
                <button
                  className="btn-action-icon delete"
                  title={cli.estado === 1 ? 'Desactivar cliente' : 'Reactivar cliente'}
                  onClick={() => handleAlternarEstado(cli)}
                >
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* MODAL FORMULARIO */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={clienteEditar ? 'Editar Cliente' : 'Agregar Cliente'}
        maxWidth="720px"
      >
        <form onSubmit={handleGuardarCliente}>
          <div className="modal-body-custom clientes-form-body">
            <div className="clientes-grid-2col">

              <div className="form-group-custom">
                <label className="label-senior">NOMBRES DEL CLIENTE *</label>
                <input
                  type="text"
                  required
                  className="input-senior"
                  placeholder="Ej. Carlos"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">APELLIDOS COMPLETOS *</label>
                <input
                  type="text"
                  required
                  className="input-senior"
                  placeholder="Ej. Mendoza"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">DOCUMENTO DE IDENTIDAD (DNI) *</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  className="input-senior"
                  placeholder="Escriba los 8 dígitos"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">NÚMERO DE TELÉFONO CELULAR</label>
                <input
                  type="text"
                  maxLength={9}
                  className="input-senior"
                  placeholder="Ej. 999111222"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div className="form-group-custom campo-completo">
                <label className="label-senior">CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  className="input-senior"
                  placeholder="Ej. cliente@correo.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                />
              </div>

            </div>
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETALLE */}
      <Modal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        title={clienteVer ? `Detalle: ${clienteVer.nombre} ${clienteVer.apellido}` : 'Detalle de Cliente'}
        maxWidth="540px"
      >
        {clienteVer && (
          <div className="modal-body-custom compact">
            <div className="usuario-detalle-card">
              <div className="detalle-row">
                <span className="detalle-label">ID Cliente:</span>
                <span className="detalle-val font-bold">#{clienteVer.id}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Nombre Completo:</span>
                <span className="detalle-val">{clienteVer.apellido}, {clienteVer.nombre}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">DNI:</span>
                <span className="detalle-val">{clienteVer.dni}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Teléfono:</span>
                <span className="detalle-val">{clienteVer.telefono || 'No registrado'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Correo:</span>
                <span className="detalle-val">{clienteVer.correo || 'No registrado'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`badge-estado-pill ${clienteVer.estado === 1 ? 'activo' : 'inactivo'}`}>
                  {clienteVer.estado === 1 ? 'Activo' : 'Inactivo'}
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

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ClientesPage;