import React, { useState, useEffect } from 'react';
import './ReservaModal.css';

export const ReservaModal = ({ isOpen, onClose, reservaEditar, onGuardar }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    telefono: '',
    personas: 2,
    fecha: '2026-10-18',
    hora: '14:00',
    observacion: ''
  });

  // Estado del calendario interactivo
  const [mesActual, setMesActual] = useState('Octubre 2026');
  const [diaSeleccionado, setDiaSeleccionado] = useState(18);

  useEffect(() => {
    if (reservaEditar) {
      setFormData({
        cliente: reservaEditar.cliente || '',
        telefono: reservaEditar.telefono || '',
        personas: reservaEditar.personas || 2,
        fecha: reservaEditar.fecha || '2026-10-18',
        hora: reservaEditar.hora || '14:00',
        observacion: reservaEditar.observacion || ''
      });
      // Extraer día si tiene formato YYYY-MM-DD
      if (reservaEditar.fecha) {
        const d = parseInt(reservaEditar.fecha.split('-')[2], 10);
        if (!isNaN(d)) setDiaSeleccionado(d);
      }
    } else {
      setFormData({
        cliente: '',
        telefono: '',
        personas: 2,
        fecha: '2026-10-18',
        hora: '14:00',
        observacion: ''
      });
      setDiaSeleccionado(18);
    }
  }, [reservaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSeleccionarDia = (dia) => {
    setDiaSeleccionado(dia);
    const diaFormatted = dia < 10 ? `0${dia}` : `${dia}`;
    setFormData(prev => ({ ...prev, fecha: `2026-10-${diaFormatted}` }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cliente.trim() || !formData.telefono.trim()) return;
    onGuardar(formData);
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-custom elder-friendly reserva-dialog-box">
        {/* Cabecera Guinda Oscuro / Verde Botánica Oficial */}
        <div className="modal-header-custom res-modal-header">
          <div className="modal-title-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
            </svg>
            <h3>{reservaEditar ? 'Editar Reserva' : 'Agregar Reserva'}</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-custom res-modal-body">
            <div className="reserva-grid-layout">
              {/* Columna Izquierda: Formulario Inputs */}
              <div className="res-col-left">
                <div className="form-group-res">
                  <label className="label-senior">NOMBRE DEL CLIENTE</label>
                  <input
                    type="text"
                    className="input-senior"
                    placeholder="Solo letras"
                    required
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  />
                </div>

                <div className="form-group-res">
                  <label className="label-senior">TELÉFONO DE CONTACTO</label>
                  <input
                    type="text"
                    className="input-senior"
                    placeholder="9 dígitos"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group-res">
                    <label className="label-senior">Nº PERSONAS</label>
                    <input
                      type="number"
                      min="1"
                      className="input-senior"
                      placeholder="Ej: 6"
                      value={formData.personas}
                      onChange={(e) => setFormData({ ...formData, personas: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-group-res">
                    <label className="label-senior">HORA PACTADA</label>
                    <input
                      type="time"
                      className="input-senior"
                      value={formData.hora}
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Minicalendario Visual */}
              <div className="res-col-right">
                <label className="label-senior">SELECCIONAR FECHA DE RESERVA</label>
                
                <div className="mini-calendar-box">
                  <div className="cal-header">
                    <button type="button" className="cal-nav-btn">‹</button>
                    <strong>{mesActual}</strong>
                    <button type="button" className="cal-nav-btn">›</button>
                  </div>

                  <div className="cal-days-header">
                    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                  </div>

                  <div className="cal-days-grid">
                    {/* Días mes anterior deshabilitados */}
                    <span className="cal-day disabled">28</span>
                    <span className="cal-day disabled">29</span>
                    <span className="cal-day disabled">30</span>
                    <span className="cal-day disabled">1</span>
                    <span className="cal-day disabled">2</span>
                    <span className="cal-day disabled">3</span>
                    <span className="cal-day disabled">4</span>
                    <span className="cal-day disabled">5</span>
                    <span className="cal-day disabled">6</span>
                    <span className="cal-day disabled">7</span>
                    <span className="cal-day disabled">8</span>
                    <span className="cal-day disabled">9</span>
                    <span className="cal-day disabled">10</span>
                    <span className="cal-day disabled">11</span>
                    <span className="cal-day disabled">12</span>
                    <span className="cal-day disabled">13</span>
                    <span className="cal-day disabled">14</span>
                    <span className="cal-day disabled">15</span>
                    <span className="cal-day disabled">16</span>
                    <span className="cal-day disabled">17</span>

                    {/* Días del mes activo */}
                    {[18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29].map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`cal-day-btn ${diaSeleccionado === d ? 'selected' : ''}`}
                        onClick={() => handleSeleccionarDia(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Campo Observación Completo abajo */}
            <div className="form-group-res full-width">
              <label className="label-senior">OBSERVACIÓN DE SERVICIO (OPCIONAL)</label>
              <textarea
                className="input-senior textarea-senior"
                rows={3}
                placeholder="Alergias, preferencias de mesa..."
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              />
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior green-theme">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservaModal;