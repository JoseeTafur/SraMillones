import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon } from '../../components/common/Icons';
import { empleadoService } from '../../services/empleadoService';
import './EmpleadosPage.css';

export const EmpleadosPage = () => {
  const [empleados, setEmpleados] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('TODOS');
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [empleadoVer, setEmpleadoVer] = useState(null);

  const [formData, setFormData] = useState({
    usuarioId: '',
    cargoId: '',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    turno: 'Único',
    fechaIngreso: ''
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Configuración de Turno Único para SRA MILLONES
  const TURNOS_SISTEMA = [
    { id: 'Único', nombre: 'Turno Único (08:00 - 18:00)' }
  ];

  const COLUMNAS_EMPLEADOS = [
    { header: 'ID', width: '70px' },
    { header: 'APELLIDOS Y NOMBRES' },
    { header: 'DNI', width: '120px' },
    { header: 'CARGO' },
    { header: 'TURNO ACTIVO', width: '140px' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '160px', align: 'center' }
  ];

  // Cargar lista de empleados, cargos y usuarios de Spring Boot
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resEmp, resCargos, resUsr] = await Promise.all([
        empleadoService.listar(),
        empleadoService.listarCargos(),
        empleadoService.listarUsuariosDisponibles()
      ]);

      if (resEmp && resEmp.success) setEmpleados(resEmp.data || []);
      if (resCargos && resCargos.success) setCargos(resCargos.data || []);
      if (resUsr && resUsr.success) setUsuariosDisponibles(resUsr.data || []);
    } catch (err) {
      console.error("Error al cargar empleados:", err);
      setToast({ type: 'error', title: 'Error de Red', message: 'No se pudieron obtener los colaboradores del servidor.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar resultados localmente
  const empleadosFiltrados = empleados.filter(e => {
    const txt = searchTerm.toLowerCase();
    const nombreCompleto = `${e.apellido || ''}, ${e.nombre || ''}`.toLowerCase();
    const dni = e.dni || '';
    const cargoNombre = e.cargo?.nombre?.toLowerCase() || '';

    const coincideTexto = nombreCompleto.includes(txt) || dni.includes(txt) || cargoNombre.includes(txt);
    const coincideTurno = filtroTurno === 'TODOS' || (e.turno && e.turno.toUpperCase() === filtroTurno.toUpperCase());

    return coincideTexto && coincideTurno;
  });

  const handleAbrirNuevo = () => {
    setEmpleadoEditar(null);
    setFormData({
      usuarioId: '',
      cargoId: '',
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      turno: 'Único',
      fechaIngreso: ''
    });
    setShowModal(true);
  };

  const handleAbrirEditar = (emp) => {
    setEmpleadoEditar(emp);
    setFormData({
      usuarioId: emp.usuario?.id || '',
      cargoId: emp.cargo?.id || '',
      nombres: emp.nombre || '',
      apellidos: emp.apellido || '',
      dni: emp.dni || '',
      telefono: emp.telefono || '',
      turno: emp.turno || 'Único',
      fechaIngreso: emp.fechaIngreso || ''
    });
    setShowModal(true);
  };

  const handleAbrirDetalle = (emp) => {
    setEmpleadoVer(emp);
    setShowDetalleModal(true);
  };

  const handleEliminar = (id, nombreCompleto) => {
    setConfirmState({
      isOpen: true,
      title: `¿Dar de baja a "${nombreCompleto}"?`,
      message: 'El colaborador pasará a estar inactivo en planillas.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await empleadoService.eliminar(id);
          if (res && res.success) {
            setToast({ type: 'info', title: 'Empleado Desactivado', message: res.message });
            cargarDatos();
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Error al eliminar.' });
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleGuardarEmpleado = async (e) => {
    e.preventDefault();
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.dni.trim() || !formData.cargoId) {
      setToast({ type: 'error', title: 'Campos requeridos', message: 'Por favor complete nombres, apellidos, DNI y cargo.' });
      return;
    }

    const payload = {
      id: empleadoEditar ? empleadoEditar.id : null,
      nombre: formData.nombres.trim(),
      apellido: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      telefono: formData.telefono.trim(),
      turno: formData.turno,
      fechaIngreso: formData.fechaIngreso || null,
      cargo: { id: parseInt(formData.cargoId) },
      usuario: formData.usuarioId ? { id: parseInt(formData.usuarioId) } : null
    };

    try {
      const res = await empleadoService.guardar(payload);
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
    <div className="empleados-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <DataTable
        title="Control de Empleados y Planillas"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        }
        actionButtonText="Nuevo Registro"
        onActionClick={handleAbrirNuevo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, DNI o cargo..."
        columns={COLUMNAS_EMPLEADOS}
        data={empleadosFiltrados}
        itemsPerPage={5}
        emptyMessage={loading ? "Cargando personal desde el servidor..." : "No se encontraron colaboradores coincidentes."}
        extraHeaderAction={
          <div className="selector-turno-header">
            <select
              className="select-turno-pill"
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
            >
              <option value="TODOS">Todos los turnos</option>
              {TURNOS_SISTEMA.map(t => (
                <option key={t.id} value={t.id}>Turno {t.id}</option>
              ))}
            </select>
          </div>
        }
        renderRow={(emp) => (
          <tr key={emp.id} className={emp.estado === 0 ? 'tr-disabled' : ''}>
            <td><span className="emp-id-bold">#{emp.id}</span></td>
            <td><span className="emp-nombre">{emp.apellido}, {emp.nombre}</span></td>
            <td><span className="emp-dni">{emp.dni}</span></td>
            <td><span className="emp-cargo">{emp.cargo?.nombre || 'Sin Cargo'}</span></td>
            <td>
              <span className={`badge-turno-pill ${(emp.turno || 'Único').toLowerCase()}`}>
                <span className="dot-turno"></span>
                {emp.turno || 'Único'}
              </span>
            </td>
            <td>
              <span className={`badge-estado-pill ${emp.estado === 1 ? 'activo' : 'inactivo'}`}>
                {emp.estado === 1 ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td>
              <div className="acciones-buttons-group">
                <button className="btn-action-icon edit" title="Editar empleado" onClick={() => handleAbrirEditar(emp)}>
                  <EditIcon />
                </button>
                <button className="btn-action-icon view" title="Ver detalle de empleado" onClick={() => handleAbrirDetalle(emp)}>
                  <EyeIcon />
                </button>
                <button className="btn-action-icon delete" title="Dar de baja empleado" onClick={() => handleEliminar(emp.id, `${emp.apellido}, ${emp.nombre}`)}>
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
        title={empleadoEditar ? 'Editar Empleado' : 'Agregar Empleado'}
        maxWidth="720px"
      >
        <form onSubmit={handleGuardarEmpleado}>
          <div className="modal-body-custom empleados-form-body">
            <div className="empleados-grid-2col">
              
              <div className="form-group-custom">
                <label className="label-senior">CUENTA DE USUARIO VINCULADA</label>
                <select
                  className="input-senior select-senior"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                >
                  <option value="">-- Sin acceso (Solo personal) --</option>
                  {usuariosDisponibles && usuariosDisponibles.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.usuario || u.username || u.nombreUsuario || `Usuario #${u.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">CARGO / FUNCIÓN OPERATIVA *</label>
                <select
                  required
                  className="input-senior select-senior"
                  value={formData.cargoId}
                  onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })}
                >
                  <option value="">-- Seleccione cargo --</option>
                  {cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">NOMBRES DEL COLABORADOR *</label>
                <input
                  type="text"
                  required
                  className="input-senior"
                  placeholder="Ej. Carlos"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">APELLIDOS COMPLETOS *</label>
                <input
                  type="text"
                  required
                  className="input-senior"
                  placeholder="Ej. Mendoza"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
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
                  className="input-senior"
                  placeholder="Ej. 999111222"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group-custom">
                <label className="label-senior">TURNO LABORAL ASIGNADO</label>
                <select
                  className="input-senior select-senior"
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                >
                  {TURNOS_SISTEMA.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">FECHA DE INGRESO DE LABORES</label>
                <input
                  type="date"
                  className="input-senior"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                />
              </div>

            </div>
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Empleado
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETALLE */}
      <Modal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        title={empleadoVer ? `Detalle: ${empleadoVer.nombre} ${empleadoVer.apellido}` : 'Detalle de Empleado'}
        maxWidth="540px"
      >
        {empleadoVer && (
          <div className="modal-body-custom compact">
            <div className="usuario-detalle-card">
              <div className="detalle-row">
                <span className="detalle-label">ID Empleado:</span>
                <span className="detalle-val font-bold">#{empleadoVer.id}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Nombre Completo:</span>
                <span className="detalle-val">{empleadoVer.apellido}, {empleadoVer.nombre}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">DNI:</span>
                <span className="detalle-val">{empleadoVer.dni}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Cargo:</span>
                <span className="detalle-val badge-rol">{empleadoVer.cargo?.nombre || 'Sin Cargo'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Turno:</span>
                <span className={`badge-turno-pill ${(empleadoVer.turno || 'Único').toLowerCase()}`}>
                  <span className="dot-turno"></span>
                  {empleadoVer.turno || 'Único'}
                </span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Teléfono:</span>
                <span className="detalle-val">{empleadoVer.telefono || 'No registrado'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Cuenta Vinculada:</span>
                <span className="detalle-val">
                  {empleadoVer.usuario?.usuario || empleadoVer.usuario?.username || empleadoVer.usuario?.nombreUsuario || 'Sin usuario'}
                </span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`badge-estado-pill ${empleadoVer.estado === 1 ? 'activo' : 'inactivo'}`}>
                  {empleadoVer.estado === 1 ? 'Activo' : 'Inactivo'}
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
        confirmText="Sí, Dar de Baja"
        cancelText="Conservar Activo"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EmpleadosPage;