import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import './SeleccionarMesaModal.css';

export const SeleccionarMesaModal = ({
  isOpen,
  onClose,
  tituloAccion = 'Seleccionar Mesa Destino',
  descripcionAccion = 'Seleccione la mesa receptora en el plano para concretar la operación.',
  mesas = [],
  mesaOrigen = null,
  onConfirmar,
  soloMesasLibres = true
}) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  if (!mesaOrigen) return null;

  // Filtrar mesas válidas
  const mesasDisponibles = mesas.filter(m => {
    if (m.id === mesaOrigen.id) return false; // No auto-selección
    if (soloMesasLibres) return m.estado === 'LIBRE';
    return true;
  });

  const handleAceptar = () => {
    if (!mesaSeleccionada) return;
    onConfirmar(mesaSeleccionada);
    setMesaSeleccionada(null);
  };

  const handleCloseModal = () => {
    setMesaSeleccionada(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={`${tituloAccion} — Mesa Origen #${mesaOrigen.numero}`}
      maxWidth="860px"
      icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <path d="M8 12h8"></path>
          <path d="M12 8v8"></path>
        </svg>
      }
    >
      <div className="seleccionar-mesa-container">
        
        {/* BANNER DE CABECERA DE OPERACIÓN */}
        <div className="picker-header-banner">
          <div className="origen-info-badge">
            <span>MESA ORIGEN:</span>
            <strong>Mesa #{mesaOrigen.numero}</strong>
          </div>
          <div className="arrow-flow-icon">➔</div>
          <p className="picker-instruction-text">{descripcionAccion}</p>
        </div>

        {/* GRILLA ELEGANTE DE TARJETAS DE MESA DE LA JAMA */}
        <div className="seleccionar-mesas-grid-lux">
          {mesasDisponibles.length === 0 ? (
            <div className="no-mesas-notice-lux">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>No existen mesas disponibles en el salón con el criterio solicitado.</span>
            </div>
          ) : (
            mesasDisponibles.map(mesa => {
              const isSelected = mesaSeleccionada?.id === mesa.id;
              const isLibre = mesa.estado === 'LIBRE';

              return (
                <div
                  key={mesa.id}
                  className={`mesa-pick-lux-card ${isSelected ? 'selected' : ''} ${isLibre ? 'libre' : 'ocupada'}`}
                  onClick={() => setMesaSeleccionada(mesa)}
                >
                  <div className="lux-card-top">
                    <span className={`lux-status-dot ${isLibre ? 'libre' : 'ocupada'}`}></span>
                    <span className="lux-status-label">{isLibre ? 'Disponible' : 'Ocupada'}</span>
                  </div>

                  <div className="lux-card-center">
                    <span className="lux-mesa-prefix">MESA</span>
                    <h2 className="lux-mesa-number">#{mesa.numero}</h2>
                  </div>

                  <div className="lux-card-footer">
                    {isLibre ? (
                      <span className="lux-capacity-tag">Libre para traslado</span>
                    ) : (
                      <span className="lux-capacity-tag ocupada">Se unificarán comandas</span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="lux-selected-overlay">
                      <div className="lux-check-icon">✔</div>
                      <span>SELECCIONADA</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DETALLE DEL TRASLADO */}
        {mesaSeleccionada && (
          <div className="resumen-traslado-lux-card">
            <div className="r-traslado-left">
              <span className="r-label">DESTINO CONFIRMADO:</span>
              <h4 className="r-title">Mesa #{mesaSeleccionada.numero}</h4>
            </div>
            <div className="r-traslado-right">
              <span className="r-badge-action">
                {mesaSeleccionada.estado === 'LIBRE' ? 'Mesa Vacía Lista' : 'Fusionar con Mesa Activa'}
              </span>
            </div>
          </div>
        )}

        {/* FOOTER DEL MODAL */}
        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-cancel-senior" onClick={handleCloseModal}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-save-senior"
            disabled={!mesaSeleccionada}
            onClick={handleAceptar}
          >
            CONFIRMAR TRASLADO
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default SeleccionarMesaModal;