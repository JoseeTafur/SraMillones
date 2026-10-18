import React, { useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { SearchIcon, PlusIcon } from '../../components/common/Icons';
import './ReservasPage.css';

export const ReservasPage = () => {
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS', 'CONFIRMADA', 'PENDIENTE', 'CANCELADA'
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null });

  // Estado para el formulario de Reserva (Incluye Selector de Calendario)
  const [formData, setFormData] = useState({
    clienteNombre: '',
    telefono: '',
    numPersonas: 2,
    mesaAsignada: 'Mesa 1',
    fecha: '2026-10-18',
    hora: '14:00',
    observacion: '',
    estado: 'CONFIRMADA'
  });

  // Fecha seleccionada en el calendario visual interactivo
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 18)); // Octubre 2026

  // Lista simulada de Reservas
  const [reservas, setReservas] = useState([
    {
      id: 1,
      codigo: 'RES-101',
      clienteNombre: 'Carlos Mendoza',
      telefono: '987654321',
      numPersonas: 4,
      mesaAsignada: 'Mesa 3',
      fecha: '2026-10-18',
      hora: '14:30',
      observacion: 'Cumpleaños, requieren silla para bebé.',
      estado: 'CONFIRMADA'
    },
    {
      id: 2,
      codigo: 'RES-102',
      clienteNombre: 'Ana María Torres',
      telefono: '912345678',
      numPersonas: 2,
      mesaAsignada: 'Mesa 7',
      fecha: '2026-10-18',
      hora: '20:00',
      observacion: 'Mesa cerca a la ventana.',
      estado: 'PENDIENTE'
    },
    {
      id: 3,
      codigo: 'RES-103',
      clienteNombre: 'Ricardo Gómez',
      telefono: '955443322',
      numPersonas: 6,
      mesaAsignada: 'Mesa 5',
      fecha: '2026-10-19',
      hora: '13:00',
      observacion: 'Alergia a mariscos.',
      estado: 'CONFIRMADA'
    },
    {
      id: 4,
      codigo: 'RES-104',
      clienteNombre: 'Lucía Benavides',
      telefono: '988776655',
      numPersonas: 3,
      mesaAsignada: 'Mesa 2',
      fecha: '2026-10-17',
      hora: '21:00',
      observacion: '',
      estado: 'CANCELADA'
    }
  ]);

  // Abrir Modal para Nueva Reserva
  const handleOpenModalNuevo = () => {
    setEditingReserva(null);
    setFormData({
      clienteNombre: '',
      telefono: '',
      numPersonas: 2,
      mesaAsignada: 'Mesa 1',
      fecha: '2026-10-18',
      hora: '14:00',
      observacion: '',
      estado: 'CONFIRMADA'
    });
    setShowModal(true);
  };

  // Abrir Modal para Editar Reserva
  const handleOpenModalEditar = (res) => {
    setEditingReserva(res);
    setFormData({
      clienteNombre: res.clienteNombre,
      telefono: res.telefono,
      numPersonas: res.numPersonas,
      mesaAsignada: res.mesaAsignada,
      fecha: res.fecha,
      hora: res.hora,
      observacion: res.observacion || '',
      estado: res.estado
    });

    const [year, month, day] = res.fecha.split('-').map(Number);
    setCalendarDate(new Date(year, month - 1, day));
    setShowModal(true);
  };

  // Solicitar Cancelar/Eliminar Reserva
  const handleSolicitarEliminar = (id) => {
    setConfirmDialog({ isOpen: true, id });
  };

  const handleConfirmarEliminar = () => {
    setReservas(prev => prev.filter(r => r.id !== confirmDialog.id));
    setConfirmDialog({ isOpen: false, id: null });
    setToast({
      type: 'info',
      title: 'Reserva Anulada',
      message: 'La reserva ha sido removida del sistema.'
    });
  };

  // Guardar Cambios (Crear o Editar)
  const handleSaveReserva = (e) => {
    e.preventDefault();

    if (!formData.clienteNombre.trim() || !formData.telefono.trim()) {
      setToast({
        type: 'error',
        title: 'Campos Incompletos',
        message: 'Por favor ingrese el nombre del cliente y teléfono de contacto.'
      });
      return;
    }

    if (editingReserva) {
      setReservas(prev => prev.map(r => r.id === editingReserva.id ? { ...r, ...formData } : r));
      setToast({
        type: 'info',
        title: 'Reserva Actualizada',
        message: `Se actualizaron los datos de ${formData.clienteNombre}.`
      });
    } else {
      const nuevaReserva = {
        id: Date.now(),
        codigo: `RES-${Math.floor(100 + Math.random() * 900)}`,
        ...formData
      };
      setReservas(prev => [nuevaReserva, ...prev]);
      setToast({
        type: 'info',
        title: '¡Reserva Registrada!',
        message: `Reserva guardada para ${formData.clienteNombre} el ${formData.fecha}.`
      });
    }

    setShowModal(false);
  };

  // Lógica del Selector Visual de Calendario
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    
    // Ajustar para que semana empiece en Lunes
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const daysArray = [];
    for (let i = 0; i < startOffset; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      daysArray.push(d);
    }
    return daysArray;
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    
    const newFecha = `${year}-${formattedMonth}-${formattedDay}`;
    setFormData(prev => ({ ...prev, fecha: newFecha }));
  };

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Filtrado de Reservas
  const reservasFiltradas = reservas.filter(res => {
    const coincideTexto = res.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.telefono.includes(searchTerm);
    const coincideEstado = filtroEstado === 'TODOS' || res.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="reservas-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* CARD PRINCIPAL CONTENEDORA DE RESERVAS */}
      <div className="reservas-card">
        {/* Header del Card */}
        <div className="reservas-card-header">
          <div className="title-box">
            <div className="icon-reserva-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h2>Gestión de Reservas</h2>
          </div>

          <button className="btn-nuevo-registro" onClick={handleOpenModalNuevo}>
            <PlusIcon width={18} height={18} /> AGREGAR RESERVA
          </button>
        </div>

        {/* Fila de Filtros y Búsqueda */}
        <div className="reservas-filters-row">
          {/* Buscador Estándar */}
          <div className="search-input-box">
            <div className="search-icon-wrapper">
              <SearchIcon width={18} height={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
                ✕
              </button>
            )}
          </div>

          {/* Pastillas de Filtro */}
          <div className="category-pills-filter">
            {['TODOS', 'CONFIRMADA', 'PENDIENTE', 'CANCELADA'].map(estado => (
              <button
                key={estado}
                className={`btn-filter-pill ${filtroEstado === estado ? 'active' : ''}`}
                onClick={() => setFiltroEstado(estado)}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA ESTILIZADA DE RESERVAS */}
        <div className="table-responsive-wrapper">
          <table className="reservas-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CLIENTE</th>
                <th>TELÉFONO</th>
                <th>MESA</th>
                <th>PERSONAS</th>
                <th>FECHA Y HORA</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No se encontraron reservas registradas.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map(res => (
                  <tr key={res.id} className={res.estado === 'CANCELADA' ? 'tr-disabled' : ''}>
                    <td>
                      <strong className="res-code">{res.codigo}</strong>
                    </td>
                    <td>
                      <div className="res-cliente-info">
                        <span className="res-nombre">{res.clienteNombre}</span>
                        {res.observacion && <small className="res-obs">• {res.observacion}</small>}
                      </div>
                    </td>
                    <td className="res-telefono">{res.telefono}</td>
                    <td>
                      <span className="badge-mesa-pill">{res.mesaAsignada}</span>
                    </td>
                    <td>
                      <strong className="res-personas">👥 {res.numPersonas}</strong>
                    </td>
                    <td>
                      <div className="res-fechahora">
                        <span>📅 {res.fecha}</span>
                        <small>⏰ {res.hora}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-estado-pill ${res.estado.toLowerCase()}`}>
                        {res.estado === 'CONFIRMADA' && '● Confirmada'}
                        {res.estado === 'PENDIENTE' && '⏳ Pendiente'}
                        {res.estado === 'CANCELADA' && '✕ Cancelada'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-buttons-group">
                        <button
                          className="btn-action-icon edit"
                          title="Editar Reserva"
                          onClick={() => handleOpenModalEditar(res)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action-icon delete"
                          title="Anular Reserva"
                          onClick={() => handleSolicitarEliminar(res.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AGREGAR / EDITAR RESERVA CON CALENDARIO INTERACTIVO */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom elder-friendly modal-reserva-wide">
            {/* Header Modal Guinda La Jama */}
            <div className="modal-header-custom">
              <div className="modal-title-box">
                <span className="modal-header-icon">📅</span>
                <h3>{editingReserva ? 'Editar Reserva' : 'Agregar Reserva'}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveReserva}>
              <div className="modal-body-custom modal-reserva-body">
                {/* COLUMNA IZQUIERDA: DATOS DE LA RESERVA */}
                <div className="reserva-form-col-left">
                  <div>
                    <label className="label-senior">NOMBRE DEL CLIENTE</label>
                    <input
                      type="text"
                      className="input-senior"
                      placeholder="Ej. Juan Pérez"
                      value={formData.clienteNombre}
                      onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="label-senior">TELÉFONO DE CONTACTO</label>
                    <input
                      type="text"
                      className="input-senior"
                      placeholder="9 dígitos"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      required
                    />
                  </div>

                  <div className="reserva-grid-2col">
                    <div>
                      <label className="label-senior">Nº PERSONAS</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="input-senior"
                        placeholder="Ej: 4"
                        value={formData.numPersonas}
                        onChange={(e) => setFormData({ ...formData, numPersonas: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div>
                      <label className="label-senior">HORA PACTADA</label>
                      <input
                        type="time"
                        className="input-senior"
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-senior">MESA ASIGNADA</label>
                    <select
                      className="input-senior"
                      value={formData.mesaAsignada}
                      onChange={(e) => setFormData({ ...formData, mesaAsignada: e.target.value })}
                    >
                      <option value="Mesa 1">Mesa 1 (2 pers)</option>
                      <option value="Mesa 2">Mesa 2 (4 pers)</option>
                      <option value="Mesa 3">Mesa 3 (4 pers)</option>
                      <option value="Mesa 4">Mesa 4 (6 pers)</option>
                      <option value="Mesa 5">Mesa 5 (8 pers)</option>
                      <option value="Mesa 7">Mesa 7 (2 pers)</option>
                    </select>
                  </div>
                </div>

                {/* COLUMNA DERECHA: SELECTOR DE FECHA CON CALENDARIO INTERACTIVO */}
                <div className="reserva-form-col-right">
                  <label className="label-senior">SELECCIONAR FECHA DE RESERVA</label>
                  
                  <div className="custom-calendar-box">
                    <div className="calendar-header-nav">
                      <button type="button" className="btn-cal-nav" onClick={handlePrevMonth}>‹</button>
                      <strong className="calendar-month-title">
                        {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                      </strong>
                      <button type="button" className="btn-cal-nav" onClick={handleNextMonth}>›</button>
                    </div>

                    <div className="calendar-weekdays-row">
                      <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                    </div>

                    <div className="calendar-days-grid">
                      {getDaysInMonth(calendarDate).map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="cal-day-cell empty"></div>;

                        const curYear = calendarDate.getFullYear();
                        const curMonth = String(calendarDate.getMonth() + 1).padStart(2, '0');
                        const curDayStr = String(day).padStart(2, '0');
                        const cellDateStr = `${curYear}-${curMonth}-${curDayStr}`;
                        const isSelected = formData.fecha === cellDateStr;

                        return (
                          <button
                            key={`day-${day}`}
                            type="button"
                            className={`cal-day-cell ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectDay(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* OBSERVACIÓN ANCHO COMPLETO */}
                <div className="reserva-obs-fullwidth">
                  <label className="label-senior">OBSERVACIÓN DE SERVICIO (OPCIONAL)</label>
                  <textarea
                    className="input-senior textarea-senior"
                    rows={2}
                    placeholder="Alergias, silla alta para bebé, celebración..."
                    value={formData.observacion}
                    onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="modal-footer-custom elder-footer compact">
                <button
                  type="button"
                  className="btn-confirm-cancel btn-cancel-senior"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save-senior">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAR ANULACIÓN */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="¿Desea anular esta reserva?"
        message="Esta acción no se podrá deshacer y liberará la mesa asignada."
        confirmText="Sí, Anular"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default ReservasPage;