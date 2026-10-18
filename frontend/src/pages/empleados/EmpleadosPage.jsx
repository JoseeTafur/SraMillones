import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EditIcon, HideIcon, EyeIcon } from '../../components/common/Icons';
import './EmpleadosPage.css';

export const EmpleadosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Filtro superior por turno
  const [filtroTurno, setFiltroTurno] = useState('TODOS');

  // Estados para Modal Registro / Edición
  const [showModal, setShowModal] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);

  // Estado para Modal Ver Detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [empleadoVer, setEmpleadoVer] = useState(null);

  // Formulario Empleado
  const [formData, setFormData] = useState({
    usuarioVinculado: '',
    cargo: '',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    turno: 'Día',
    fechaIngreso: ''
  });

  // Estado para ConfirmDialog
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Lista de cargos operativos
  const CARGOS_SISTEMA = [
    'Repartidor',
    'Cocinero frío',
    'Cocinero caliente',
    'Mesero',
    'Cajero',
    'Administrador'
  ];

  // Lista de turnos (preparada para expandir en el futuro)
  const TURNOS_SISTEMA = [
    { id: 'Día', nombre: 'Turno Día (08:00 - 18:00)' },
    { id: 'Noche', nombre: 'Turno Noche (18:00 - 02:00)' }
  ];

  // Cuentas de usuario disponibles para vincular
  const CUENTAS_USUARIOS = [
    { id: 'usr_13', username: 'Mesero' },
    { id: 'usr_11', username: 'CocineroFrio' },
    { id: 'usr_12', username: 'CocineroCaliente' }
  ];

  // Datos simulados de empleados
  const [empleados, setEmpleados] = useState([
    { id: 13, nombres: 'Juan', apellidos: 'Pérez', dni: '12345678', cargo: 'Repartidor', turno: 'Día', telefono: '987654321', fechaIngreso: '2025-01-15', usuarioVinculado: 'Sin acceso', estado: 'Activo' },
    { id: 14, nombres: 'Carlos', apellidos: 'Mendoza', dni: '23456789', cargo: 'Cocinero frío', turno: 'Día', telefono: '999111222', fechaIngreso: '2025-02-01', usuarioVinculado: 'CocineroFrio', estado: 'Activo' },
    { id: 15, nombres: 'Luis', apellidos: 'Gómez', dni: '34567890', cargo: 'Cocinero caliente', turno: 'Día', telefono: '988222333', fechaIngreso: '2025-02-10', usuarioVinculado: 'CocineroCaliente', estado: 'Activo' },
    { id: 16, nombres: 'Ana', apellidos: 'Torres', dni: '45678901', cargo: 'Mesero', turno: 'Día', telefono: '977333444', fechaIngreso: '2025-03-05', usuarioVinculado: 'Mesero', estado: 'Activo' }
  ]);

  const COLUMNAS_EMPLEADOS = [
    { header: 'ID', width: '70px' },
    { header: 'APELLIDOS Y NOMBRES' },
    { header: 'DNI', width: '120px' },
    { header: 'CARGO' },
    { header: 'TURNO ACTIVO', width: '140px' },
    { header: 'ESTADO', width: '120px' },
    { header: 'ACCIONES', width: '160px', align: 'center' }
  ];

  // Filtrado de empleados
  const empleadosFiltrados = empleados.filter(e => {
    const txt = searchTerm.toLowerCase();
    const nombreCompleto = `${e.apellidos}, ${e.nombres}`.toLowerCase();
    const coincideTexto = nombreCompleto.includes(txt) ||
                          e.dni.includes(txt) ||
                          e.cargo.toLowerCase().includes(txt);
    const coincideTurno = filtroTurno === 'TODOS' || e.turno === filtroTurno;

    return coincideTexto && coincideTurno;
  });

  const handleAbrirNuevo = () => {
    setEmpleadoEditar(null);
    setFormData({
      usuarioVinculado: '',
      cargo: '',
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      turno: 'Día',
      fechaIngreso: ''
    });
    setShowModal(true);
  };

  const handleAbrirEditar = (emp) => {
    setEmpleadoEditar(emp);
    setFormData({
      usuarioVinculado: emp.usuarioVinculado || '',
      cargo: emp.cargo || '',
      nombres: emp.nombres || '',
      apellidos: emp.apellidos || '',
      dni: emp.dni || '',
      telefono: emp.telefono || '',
      turno: emp.turno || 'Día',
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
      message: 'El colaborador pasará a estar inactivo en planillas, conservando sus registros históricos.',
      type: 'warning',
      onConfirm: () => {
        setEmpleados(prev => prev.map(e => e.id === id ? { ...e, estado: 'Inactivo' } : e));
        setToast({ type: 'info', title: 'Empleado Desactivado', message: `"${nombreCompleto}" ha sido dado de baja.` });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleGuardarEmpleado = (e) => {
    e.preventDefault();
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.dni.trim() || !formData.cargo) {
      setToast({ type: 'error', title: 'Campos requeridos', message: 'Por favor complete nombres, apellidos, DNI y cargo.' });
      return;
    }

    const nombreCompletoFormateado = `${formData.apellidos}, ${formData.nombres}`;

    if (empleadoEditar) {
      setEmpleados(empleados.map(emp => emp.id === empleadoEditar.id ? { ...emp, ...formData } : emp));
      setToast({ type: 'info', title: 'Empleado Actualizado', message: `Datos de "${nombreCompletoFormateado}" guardados.` });
    } else {
      const nuevo = {
        id: Date.now(),
        ...formData,
        estado: 'Activo'
      };
      setEmpleados([nuevo, ...empleados]);
      setToast({ type: 'info', title: '¡Empleado Registrado!', message: `"${nombreCompletoFormateado}" agregado al personal.` });
    }

    setShowModal(false);
  };

  return (
    <div className="empleados-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* DATATABLE UNIVERSAL DE EMPLEADOS */}
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
        emptyMessage="No se encontraron colaboradores coincidentes."
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
          <tr key={emp.id} className={emp.estado === 'Inactivo' ? 'tr-disabled' : ''}>
            <td><span className="emp-id-bold">{emp.id}</span></td>
            <td><span className="emp-nombre">{emp.apellidos}, {emp.nombres}</span></td>
            <td><span className="emp-dni">{emp.dni}</span></td>
            <td><span className="emp-cargo">{emp.cargo}</span></td>
            <td>
              <span className={`badge-turno-pill ${emp.turno.toLowerCase()}`}>
                <span className="dot-turno"></span>
                {emp.turno}
              </span>
            </td>
            <td>
              <span className={`badge-estado-pill ${emp.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                {emp.estado}
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
                <button className="btn-action-icon delete" title="Dar de baja empleado" onClick={() => handleEliminar(emp.id, `${emp.apellidos}, ${emp.nombres}`)}>
                  <HideIcon />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* MODAL: AGREGAR / EDITAR EMPLEADO */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={empleadoEditar ? 'Editar Empleado' : 'Agregar Empleado'}
        maxWidth="720px"
      >
        <form onSubmit={handleGuardarEmpleado}>
          <div className="modal-body-custom empleados-form-body">
            <div className="empleados-grid-2col">
              
              {/* 1. Cuenta de Usuario Vinculada */}
              <div className="form-group-custom">
                <label className="label-senior">CUENTA DE USUARIO VINCULADA</label>
                <select
                  className="input-senior select-senior"
                  value={formData.usuarioVinculado}
                  onChange={(e) => setFormData({ ...formData, usuarioVinculado: e.target.value })}
                >
                  <option value="">-- Sin acceso (Solo personal) --</option>
                  {CUENTAS_USUARIOS.map(u => (
                    <option key={u.id} value={u.username}>{u.username}</option>
                  ))}
                </select>
              </div>

              {/* 2. Cargo / Función Operativa */}
              <div className="form-group-custom">
                <label className="label-senior">CARGO / FUNCIÓN OPERATIVA *</label>
                <select
                  required
                  className="input-senior select-senior"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                >
                  <option value="">-- Seleccione cargo --</option>
                  {CARGOS_SISTEMA.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 3. Nombres */}
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

              {/* 4. Apellidos */}
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

              {/* 5. DNI */}
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

              {/* 6. Teléfono */}
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

              {/* 7. Turno Laboral */}
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

              {/* 8. Fecha de Ingreso */}
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

      {/* MODAL VER DETALLE */}
      <Modal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        title={empleadoVer ? `Detalle: ${empleadoVer.nombres} ${empleadoVer.apellidos}` : 'Detalle de Empleado'}
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
                <span className="detalle-val">{empleadoVer.apellidos}, {empleadoVer.nombres}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">DNI:</span>
                <span className="detalle-val">{empleadoVer.dni}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Cargo:</span>
                <span className="detalle-val badge-rol">{empleadoVer.cargo}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Turno:</span>
                <span className={`badge-turno-pill ${empleadoVer.turno.toLowerCase()}`}>
                  <span className="dot-turno"></span>
                  {empleadoVer.turno}
                </span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Teléfono:</span>
                <span className="detalle-val">{empleadoVer.telefono || 'No registrado'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Cuenta Vinculada:</span>
                <span className="detalle-val">{empleadoVer.usuarioVinculado || 'Sin usuario'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`badge-estado-pill ${empleadoVer.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                  {empleadoVer.estado}
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

export default EmpleadosPage;