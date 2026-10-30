import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import './MesaPagoModal.css';

export const MesaPagoModal = ({ isOpen, onClose, selectedMesa, onConfirmPago, setToast }) => {
  const [numTickets, setNumTickets] = useState(1);
  const [modoDivision, setModoDivision] = useState('PRODUCTOS'); // 'PRODUCTOS', 'IGUALES', 'PORCENTAJES'
  const [asignaciones, setAsignaciones] = useState({});
  const [ticketsData, setTicketsData] = useState([
    { id: 1, porcentaje: 100, propina: 0, metodoPago: 'EFECTIVO' }
  ]);

  useEffect(() => {
    if (!selectedMesa || !selectedMesa.comanda) return;

    const idsElegidos = selectedMesa.selectedItemsPay || [];
    const comandaAProcesar = idsElegidos.length > 0
      ? selectedMesa.comanda.filter(i => idsElegidos.includes(i.id))
      : selectedMesa.comanda;

    const iniciales = {};
    comandaAProcesar.forEach(item => {
      iniciales[item.id] = 1;
    });
    setAsignaciones(iniciales);
  }, [selectedMesa, isOpen]);

  if (!selectedMesa) return null;

  const idsElegidos = selectedMesa.selectedItemsPay || [];
  const comandaAProcesar = idsElegidos.length > 0
    ? selectedMesa.comanda.filter(i => idsElegidos.includes(i.id))
    : selectedMesa.comanda;

  const totalGeneral = comandaAProcesar.reduce((acc, i) => acc + (i.cant * i.precio), 0);

  const handleNumTicketsChange = (cantidad) => {
    const cant = parseInt(cantidad, 10);
    setNumTickets(cant);

    const porcIgual = Math.floor((100 / cant) * 10) / 10;
    const ajusteUltimo = 100 - (porcIgual * (cant - 1));

    const nuevosTickets = Array.from({ length: cant }, (_, index) => ({
      id: index + 1,
      porcentaje: index === cant - 1 ? parseFloat(ajusteUltimo.toFixed(1)) : porcIgual,
      propina: 0,
      metodoPago: 'EFECTIVO',
      nombreCliente: ''
    }));

    setTicketsData(nuevosTickets);
  };

  const handleAsignarProductoATicket = (itemId, ticketId) => {
    setAsignaciones(prev => ({ ...prev, [itemId]: parseInt(ticketId, 10) }));
  };

  const handleUpdateTicketField = (ticketIndex, field, value) => {
    setTicketsData(prev => prev.map((t, i) => i === ticketIndex ? { ...t, [field]: value } : t));
  };

  const calcularMontoBaseTicket = (ticketId, index) => {
    if (modoDivision === 'PRODUCTOS') {
      return comandaAProcesar
        .filter(item => (asignaciones[item.id] || 1) === ticketId)
        .reduce((acc, item) => acc + (item.cant * item.precio), 0);
    }

    if (modoDivision === 'IGUALES') {
      const basePorTicket = Math.floor((totalGeneral / numTickets) * 100) / 100;
      const diferenciaCentavos = totalGeneral - (basePorTicket * numTickets);
      
      return index === numTickets - 1 
        ? basePorTicket + diferenciaCentavos 
        : basePorTicket;
    }

    if (modoDivision === 'PORCENTAJES') {
      const porcentaje = ticketsData[index]?.porcentaje || 0;
      return (totalGeneral * porcentaje) / 100;
    }

    return 0;
  };

  // 🛡️ Verifica si hay algún ticket sin monto asignado
  const hayTicketsVacios = ticketsData.some((t, index) => calcularMontoBaseTicket(t.id, index) <= 0);

  const handleSubmitPago = (e) => {
    e.preventDefault();

    if (hayTicketsVacios) {
      setToast({
        type: 'error',
        title: 'Tickets Incompletos',
        message: 'No puedes procesar el cobro porque hay tickets sin consumo asignado.'
      });
      return;
    }

    if (modoDivision === 'PORCENTAJES') {
      const sumaPorcentajes = ticketsData.reduce((acc, t) => acc + parseFloat(t.porcentaje || 0), 0);
      if (Math.abs(sumaPorcentajes - 100) > 0.1) {
        setToast({
          type: 'error',
          title: 'Porcentajes Inválidos',
          message: `La suma de los porcentajes debe ser exactamente 100% (Suma actual: ${sumaPorcentajes.toFixed(1)}%).`
        });
        return;
      }
    }

    const payloadTickets = ticketsData.map((t, index) => {
      const montoBase = calcularMontoBaseTicket(t.id, index);
      const propinaVal = parseFloat(t.propina) || 0;

      const nombreLimpio = t.nombreCliente && t.nombreCliente.trim() !== ''
        ? t.nombreCliente.trim().toUpperCase()
        : `CLIENTE MESA #${selectedMesa.numero}`;

      return {
        ticketId: t.id,
        nombreCliente: nombreLimpio,
        metodoPago: t.metodoPago,
        propina: propinaVal,
        montoBase: montoBase,
        montoFinal: montoBase + propinaVal,
        itemsIncluidos: modoDivision === 'PRODUCTOS' 
          ? comandaAProcesar.filter(i => (asignaciones[i.id] || 1) === t.id).map(i => i.id)
          : comandaAProcesar.map(i => i.id)
      };
    });

    onConfirmPago({
      comandaId: selectedMesa.comandaId,
      mesaId: selectedMesa.id,
      modoDivision,
      tickets: payloadTickets
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Caja & División de Tickets — Mesa #${selectedMesa.numero}`}
      maxWidth="1240px"
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      }
    >
      <form onSubmit={handleSubmitPago} className="pago-modal-wrapper-xl">
        <div className="pago-modal-split-xl">
          
          {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
          <div className="pago-col-config-xl">
            <div className="pago-total-mesa-banner-xl">
              <span className="banner-subtitle">TOTAL SELECCIONADO (MESA #{selectedMesa.numero})</span>
              <h1 className="banner-monto-xl">S/ {totalGeneral.toFixed(2)}</h1>
              <span className="banner-items-count">{comandaAProcesar.length} platillos/bebidas en cobro</span>
            </div>

            <div className="form-group-custom">
              <label className="label-senior">MODALIDAD DE DIVISIÓN DE CUENTA</label>
              <div className="division-mode-buttons-xl">
                <button
                  type="button"
                  className={`btn-div-mode-xl ${modoDivision === 'PRODUCTOS' ? 'active' : ''}`}
                  onClick={() => setModoDivision('PRODUCTOS')}
                >
                  🍽 Por Ítems
                </button>
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
            </div>

            <div className="form-group-custom">
              <label className="label-senior">CANTIDAD DE TICKETS / PERSONAS</label>
              <select
                className="input-senior select-senior xl-select"
                value={numTickets}
                onChange={(e) => handleNumTicketsChange(e.target.value)}
              >
                <option value={1}>1 Ticket Único (100% de la Mesa)</option>
                <option value={2}>2 Tickets (Dividido entre 2)</option>
                <option value={3}>3 Tickets (Dividido entre 3)</option>
                <option value={4}>4 Tickets (Dividido entre 4)</option>
              </select>
            </div>

            {/* LISTA DE ASIGNACIÓN (Paso 1: Por Ítems) */}
            {modoDivision === 'PRODUCTOS' && (
              <div className="form-group-custom">
                <label className="label-senior">ASIGNAR PLATOS A CADA TICKET</label>
                <div className="consumos-pago-list-xl">
                  {comandaAProcesar.map(it => (
                    <div key={it.id} className="consumo-pago-row-xl">
                      <div className="c-pago-left">
                        <span className="badge-cant-tag">{it.cant}x</span>
                        <span className="nombre-prod">{it.nombre}</span>
                      </div>
                      <div className="c-pago-right">
                        <strong className="monto-prod">S/ {(it.cant * it.precio).toFixed(2)}</strong>
                        <select
                          className="select-ticket-item-assign"
                          value={asignaciones[it.id] || 1}
                          onChange={(e) => handleAsignarProductoATicket(it.id, e.target.value)}
                        >
                          {Array.from({ length: numTickets }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              Ticket #{idx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: TICKETS A EMITIR */}
          <div className="pago-col-tickets-scroll-xl">
            {ticketsData.map((ticket, index) => {
              const montoBaseTicket = calcularMontoBaseTicket(ticket.id, index);
              const propinaVal = parseFloat(ticket.propina) || 0;
              const totalFinalTicket = montoBaseTicket + propinaVal;
              const esVacio = montoBaseTicket <= 0;

              // Obtener platillos a mostrar según el modo activo
              const platosMostrar = modoDivision === 'PRODUCTOS'
                ? comandaAProcesar.filter(i => (asignaciones[i.id] || 1) === ticket.id)
                : comandaAProcesar;

              return (
                <div key={ticket.id} className={`ticket-card-box-xl ${esVacio ? 'ticket-warning' : ''}`}>
                  <div className="ticket-top-header">
                    <span className="ticket-number-badge">TICKET #{ticket.id}</span>
                    
                    {esVacio && (
                      <span className="badge-ticket-vacio">⚠️ Ticket Vacío</span>
                    )}

                    {modoDivision === 'PORCENTAJES' && (
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
                    )}
                  </div>

                  {/* 🎯 DESGLOSE SIEMPRE VISIBLE EN TODAS LAS MODALIDADES */}
                  <div className="ticket-pedidos-box">
                    <span className="ticket-section-title">🍽 PLATOS EN ESTE TICKET:</span>
                    <div className="ticket-pedidos-list">
                      {platosMostrar.length === 0 ? (
                        <span className="empty-ticket-msg">No hay platillos asignados a este ticket.</span>
                      ) : (
                        platosMostrar.map(prod => {
                          // En 'PRODUCTOS' se muestra el precio real del plato.
                          // En 'PORCENTAJES' e 'IGUALES' se calcula la parte proporcional del plato para ese ticket.
                          const porcentajeTicket = modoDivision === 'PORCENTAJES'
                            ? (ticket.porcentaje || 0)
                            : modoDivision === 'IGUALES'
                              ? (100 / numTickets)
                              : 100;

                          const precioMostrar = modoDivision === 'PRODUCTOS'
                            ? (prod.cant * prod.precio)
                            : (prod.cant * prod.precio * (porcentajeTicket / 100));

                          return (
                            <div key={prod.id} className="ticket-item-detail">
                              <span className="item-txt">• {prod.cant}x {prod.nombre}</span>
                              <span className="item-submonto">S/ {precioMostrar.toFixed(2)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="ticket-row-summary">
                    <span>Subtotal Consumo:</span>
                    <strong>S/ {montoBaseTicket.toFixed(2)}</strong>
                  </div>

                  <div className="ticket-row-input">
                    <label className="label-senior">NOMBRE DEL CLIENTE:</label>
                    <input
                      type="text"
                      className="input-senior"
                      style={{ textTransform: 'uppercase' }}
                      placeholder={`Ej. NOMBRE CLIENTE (Mesa #${selectedMesa.numero})`}
                      value={ticket.nombreCliente || ''}
                      onChange={(e) => handleUpdateTicketField(index, 'nombreCliente', e.target.value.toUpperCase())}
                    />
                  </div>

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

                  <div className="ticket-total-banner-xl">
                    <span>TOTAL TICKET #{ticket.id}:</span>
                    <h3>S/ {totalFinalTicket.toFixed(2)}</h3>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-cancel-senior" onClick={onClose}>
            Cancelar
          </button>
          
          <button
            type="submit"
            className={`btn-save-senior green-glow-xl ${hayTicketsVacios ? 'btn-disabled' : ''}`}
            disabled={hayTicketsVacios}
          >
            {hayTicketsVacios ? '⚠️ ASIGNE CONSUMO A TODOS LOS TICKETS' : '🛡 CONFIRMAR COBRO Y EMITIR VENTA'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MesaPagoModal;