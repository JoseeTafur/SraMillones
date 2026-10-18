import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import './MesaPagoModal.css';

export const MesaPagoModal = ({ isOpen, onClose, selectedMesa, onConfirmPago, setToast }) => {
  const [numComprobantes, setNumComprobantes] = useState(1);
  const [modoDivision, setModoDivision] = useState('IGUALES'); // 'IGUALES', 'PORCENTAJES'

  // Estado de los Tickets
  const [ticketsData, setTicketsData] = useState([
    {
      id: 1,
      porcentaje: 100,
      propina: 0,
      metodoPago: 'EFECTIVO'
    }
  ]);

  if (!selectedMesa) return null;

  const subtotalGeneral = selectedMesa.comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0);

  // Cambio en la cantidad de comprobantes
  const handleNumComprobantesChange = (cantidad) => {
    const cant = parseInt(cantidad, 10);
    setNumComprobantes(cant);

    const porcIgual = Math.round((100 / cant) * 100) / 100;
    const nuevosTickets = Array.from({ length: cant }, (_, index) => ({
      id: index + 1,
      porcentaje: porcIgual,
      propina: 0,
      metodoPago: 'EFECTIVO'
    }));

    setTicketsData(nuevosTickets);
  };

  const handleUpdateTicketField = (ticketIndex, field, value) => {
    setTicketsData(prev => prev.map((t, i) => i === ticketIndex ? { ...t, [field]: value } : t));
  };

  const handleSubmitPago = (e) => {
    e.preventDefault();

    const sumaPorcentajes = ticketsData.reduce((acc, t) => acc + parseFloat(t.porcentaje || 0), 0);
    if (Math.abs(sumaPorcentajes - 100) > 0.5) {
      setToast({
        type: 'error',
        title: 'División Incompleta',
        message: `La suma de los porcentajes debe dar 100% (Suma actual: ${sumaPorcentajes.toFixed(1)}%).`
      });
      return;
    }

    onConfirmPago(ticketsData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Caja & División de Tickets — Mesa #${selectedMesa.numero}`}
      maxWidth="1180px"
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      }
    >
      <form onSubmit={handleSubmitPago} className="pago-modal-wrapper-xl">
        <div className="pago-modal-split-xl">
          
          {/* PANEL IZQUIERDO: RESUMEN DE LA MESA Y DIVISIÓN */}
          <div className="pago-col-config-xl">
            {/* Banner Gran Total */}
            <div className="pago-total-mesa-banner-xl">
              <span className="banner-subtitle">TOTAL MESA #{selectedMesa.numero}</span>
              <h1 className="banner-monto-xl">S/ {subtotalGeneral.toFixed(2)}</h1>
              <span className="banner-items-count">{selectedMesa.comanda.length} platillos/bebidas en comanda</span>
            </div>

            {/* Consumos Completos de la Mesa */}
            <div className="form-group-custom">
              <label className="label-senior">DETALLE DE PEDIDOS EN COMANDAS</label>
              <div className="consumos-pago-list-xl">
                {selectedMesa.comanda.map(it => (
                  <div key={it.id} className="consumo-pago-row-xl">
                    <div className="c-pago-left">
                      <span className="badge-cant-tag">{it.cant}x</span>
                      <span className="nombre-prod">{it.nombre}</span>
                    </div>
                    <div className="c-pago-right">
                      <strong>S/ {(it.cant * it.precio).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración de División */}
            <div className="form-group-custom">
              <label className="label-senior">NÚMERO DE TICKETS / CLIENTES</label>
              <select
                className="input-senior select-senior xl-select"
                value={numComprobantes}
                onChange={(e) => handleNumComprobantesChange(e.target.value)}
              >
                <option value={1}>1 Ticket Único (100% de la Mesa)</option>
                <option value={2}>2 Tickets (Dividido entre 2 personas)</option>
                <option value={3}>3 Tickets (Dividido entre 3 personas)</option>
                <option value={4}>4 Tickets (Dividido entre 4 personas)</option>
              </select>
            </div>

            {/* Modalidad de Cuadre */}
            <div className="division-mode-buttons-xl">
              <button
                type="button"
                className={`btn-div-mode-xl ${modoDivision === 'IGUALES' ? 'active' : ''}`}
                onClick={() => setModoDivision('IGUALES')}
              >
                ◔ Partes Iguales
              </button>
              <button
                type="button"
                className={`btn-div-mode-xl ${modoDivision === 'PORCENTAJES' ? 'active' : ''}`}
                onClick={() => setModoDivision('PORCENTAJES')}
              >
                % Porcentajes
              </button>
            </div>

            {/* Estado de Cuadre */}
            <div className="cuadre-status-footer-xl">
              <span>ESTADO DE CUADRE:</span>
              <strong className="status-ok">✔ S/ 0.00 (Mesa 100% Asignada)</strong>
            </div>
          </div>

          {/* PANEL DERECHO: TICKETS GRANDES CON PEDIDOS DETALLADOS */}
          <div className="pago-col-tickets-scroll-xl">
            {ticketsData.map((ticket, index) => {
              const montoProporcional = (subtotalGeneral * (ticket.porcentaje / 100));
              const propinaVal = parseFloat(ticket.propina) || 0;
              const totalFinalTicket = montoProporcional + propinaVal;

              return (
                <div key={ticket.id} className="ticket-card-box-xl">
                  {/* Encabezado del Ticket */}
                  <div className="ticket-top-header">
                    <span className="ticket-number-badge">TICKET #{ticket.id}</span>
                    <div className="ticket-porcentaje-badge">
                      {numComprobantes > 1 ? (
                        <div className="input-porcentaje-wrap">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            className="input-porcentaje-xl"
                            value={ticket.porcentaje}
                            onChange={(e) => handleUpdateTicketField(index, 'porcentaje', parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span>100% del consumo</span>
                      )}
                    </div>
                  </div>

                  {/* DESGLOSE DE PLATOS/PEDIDOS DENTRO DEL TICKET */}
                  <div className="ticket-pedidos-box">
                    <span className="ticket-section-title">🍽 PLATOS Y CONSUMOS INCLUIDOS:</span>
                    <div className="ticket-pedidos-list">
                      {selectedMesa.comanda.map(prod => {
                        const subtotalItem = (prod.cant * prod.precio * (ticket.porcentaje / 100));
                        return (
                          <div key={prod.id} className="ticket-item-detail">
                            <div className="item-detail-left">
                              <span className="item-dot">•</span>
                              <span className="item-txt">{prod.cant}x {prod.nombre}</span>
                            </div>
                            <span className="item-submonto">S/ {subtotalItem.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cálculo Subtotal Consumo */}
                  <div className="ticket-row-summary">
                    <span>Subtotal Consumo:</span>
                    <strong>S/ {montoProporcional.toFixed(2)}</strong>
                  </div>

                  {/* Propina Extra */}
                  <div className="ticket-row-input">
                    <label>Propina Voluntaria (S/):</label>
                    <input
                      type="number"
                      step="0.50"
                      className="input-propina-xl"
                      placeholder="0.00"
                      value={ticket.propina}
                      onChange={(e) => handleUpdateTicketField(index, 'propina', e.target.value)}
                    />
                  </div>

                  {/* Selector de Método de Pago */}
                  <div className="ticket-row-select">
                    <label className="label-senior">Forma de Pago:</label>
                    <select
                      className="select-ticket-metodo-xl"
                      value={ticket.metodoPago}
                      onChange={(e) => handleUpdateTicketField(index, 'metodoPago', e.target.value)}
                    >
                      <option value="EFECTIVO">💵 Efectivo / Gaveta</option>
                      <option value="YAPE">💜 Yape (QR)</option>
                      <option value="PLIN">💙 Plin (QR)</option>
                      <option value="TARJETA">💳 Tarjeta POS (Débito/Crédito)</option>
                    </select>
                  </div>

                  {/* Banner Total Final Ticket */}
                  <div className="ticket-total-banner-xl">
                    <span>TOTAL A COBRAR:</span>
                    <h3>S/ {totalFinalTicket.toFixed(2)}</h3>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer de Acciones del Modal */}
        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-cancel-senior" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save-senior green-glow-xl">
            🛡 CONFIRMAR COBRO Y LIBERAR MESA
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MesaPagoModal;