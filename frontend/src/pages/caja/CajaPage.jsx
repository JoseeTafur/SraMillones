import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { EyeIcon } from '../../components/common/Icons';
import './CajaPage.css';

export const CajaPage = () => {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('POR_COBRAR'); // POR_COBRAR, LIQUIDADOS, BITACORA, HISTORIAL, BUSCADOR
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showDetalleOrdenModal, setShowDetalleOrdenModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Estados del Arqueo / Caja
  const [cajaState, setCajaState] = useState({
    fondoApertura: 200.00,
    ventasTurno: 0.00,
    efectivoGaveta: 200.00,
    balanceYape: 0.00,
    balancePlin: 0.00,
    porTarjeta: 0.00,
    ingresosManualesCount: 0,
    egresosManualesCount: 0,
    ingresosManualesMonto: 0.00,
    egresosManualesMonto: 0.00
  });

  // Estado para Formulario de Movimiento Manual
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: 'INGRESO', // INGRESO, EGRESO
    monto: '',
    motivo: ''
  });

  // Estado para Formulario de Cobro
  const [cobroForm, setCobroForm] = useState({
    metodoPago: 'EFECTIVO', // EFECTIVO, YAPE, PLIN, TARJETA
    montoRecibido: '',
    vuelto: 0.00
  });

  // ConfirmDialog para Cerrar Caja
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Órdenes Simuladas por Cobrar
  const [ordenesPorCobrar, setOrdenesPorCobrar] = useState([
    { id: '#3', servicio: 'Salón', mesa: 'Mesa Nº 5', registro: '14:26', total: 35.00, estado: 'POR COBRAR', items: [{ nombre: 'Lomo Saltado', cant: 1, precio: 35.00 }] },
    { id: '#1', servicio: 'Salón', mesa: 'Mesa Nº 1', registro: '10:18', total: 35.00, estado: 'POR COBRAR', items: [{ nombre: 'Causa Limeña', cant: 1, precio: 20.00 }, { nombre: 'Chicha Morada 1L', cant: 1, precio: 15.00 }] }
  ]);

  // Órdenes Liquidadas
  const [ordenesLiquidadas, setOrdenesLiquidadas] = useState([]);

  // Bitácora de Movimientos Manuales
  const [bitacoraMovimientos, setBitacoraMovimientos] = useState([]);

  // Cálculo del saldo esperado total
  const saldoEsperadoTotal = cajaState.fondoApertura + cajaState.ventasTurno + cajaState.ingresosManualesMonto - cajaState.egresosManualesMonto;

  // Abrir Modal Cobro
  const handleAbrirCobro = (orden) => {
    setOrdenSeleccionada(orden);
    setCobroForm({
      metodoPago: 'EFECTIVO',
      montoRecibido: orden.total.toFixed(2),
      vuelto: 0.00
    });
    setShowCobroModal(true);
  };

  // Cambio de Monto Recibido en Cobro de Efectivo
  const handleMontoRecibidoChange = (val) => {
    const recibido = parseFloat(val) || 0;
    const total = ordenSeleccionada ? ordenSeleccionada.total : 0;
    const vueltoCalc = Math.max(0, recibido - total);

    setCobroForm(prev => ({
      ...prev,
      montoRecibido: val,
      vuelto: vueltoCalc
    }));
  };

  // Procesar Pago de Orden
  const handleProcesarCobro = (e) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;

    const total = ordenSeleccionada.total;
    const metodo = cobroForm.metodoPago;

    if (metodo === 'EFECTIVO') {
      const recibido = parseFloat(cobroForm.montoRecibido);
      if (isNaN(recibido) || recibido < total) {
        setToast({ type: 'error', title: 'Monto Insuficiente', message: 'El monto ingresado es menor al total a cobrar.' });
        return;
      }
    }

    // Actualizar Caja según el método de pago
    setCajaState(prev => {
      const newVentas = prev.ventasTurno + total;
      let newEfectivo = prev.efectivoGaveta;
      let newYape = prev.balanceYape;
      let newPlin = prev.balancePlin;
      let newTarjeta = prev.porTarjeta;

      if (metodo === 'EFECTIVO') newEfectivo += total;
      if (metodo === 'YAPE') newYape += total;
      if (metodo === 'PLIN') newPlin += total;
      if (metodo === 'TARJETA') newTarjeta += total;

      return {
        ...prev,
        ventasTurno: newVentas,
        efectivoGaveta: newEfectivo,
        balanceYape: newYape,
        balancePlin: newPlin,
        porTarjeta: newTarjeta
      };
    });

    // Mover orden de "Por Cobrar" a "Liquidadas"
    const ordenPagada = { ...ordenSeleccionada, estado: 'PAGADO', metodoPago: metodo, horaPago: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setOrdenesPorCobrar(prev => prev.filter(o => o.id !== ordenSeleccionada.id));
    setOrdenesLiquidadas(prev => [ordenPagada, ...prev]);

    setToast({
      type: 'info',
      title: '¡Orden Cobrada!',
      message: `La orden ${ordenSeleccionada.id} fue procesada exitosamente vía ${metodo}.`
    });

    setShowCobroModal(false);
  };

  // Procesar Movimiento Manual (Ingreso / Egreso)
  const handleGuardarMovimientoManual = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(movimientoForm.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setToast({ type: 'error', title: 'Monto Inválido', message: 'Ingrese una cantidad válida mayor a S/ 0.' });
      return;
    }

    if (!movimientoForm.motivo.trim()) {
      setToast({ type: 'error', title: 'Motivo Requerido', message: 'Escriba la razón de este movimiento manual.' });
      return;
    }

    setCajaState(prev => {
      if (movimientoForm.tipo === 'INGRESO') {
        return {
          ...prev,
          efectivoGaveta: prev.efectivoGaveta + montoNum,
          ingresosManualesCount: prev.ingresosManualesCount + 1,
          ingresosManualesMonto: prev.ingresosManualesMonto + montoNum
        };
      } else {
        return {
          ...prev,
          efectivoGaveta: Math.max(0, prev.efectivoGaveta - montoNum),
          egresosManualesCount: prev.egresosManualesCount + 1,
          egresosManualesMonto: prev.egresosManualesMonto + montoNum
        };
      }
    });

    // Registrar en Bitácora
    setBitacoraMovimientos(prev => [
      {
        id: Date.now(),
        tipo: movimientoForm.tipo,
        monto: montoNum,
        motivo: movimientoForm.motivo,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);

    setToast({
      type: 'info',
      title: 'Movimiento Registrado',
      message: `Se registró un ${movimientoForm.tipo} por S/ ${montoNum.toFixed(2)}.`
    });

    setShowMovimientoModal(false);
    setMovimientoForm({ tipo: 'INGRESO', monto: '', motivo: '' });
  };

  // Confirmar Cierre de Caja
  const handleSolicitarCierreCaja = () => {
    setConfirmState({
      isOpen: true,
      title: '¿Cerrar Caja Operativa del Turno?',
      message: `Se procederá al arqueo final del turno con un saldo total de S/ ${saldoEsperadoTotal.toFixed(2)}. Esta acción emitirá el reporte z/cierre de caja.`,
      type: 'warning',
      onConfirm: () => {
        setToast({ type: 'info', title: 'Caja Cerrada', message: 'El arqueo de caja fue liquidado y cerrado correctamente.' });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Columnas para Tabla de Órdenes por Cobrar
  const COLUMNAS_POR_COBRAR = [
    { header: 'ID ORDEN', width: '90px' },
    { header: 'TIPO SERVICIO' },
    { header: 'MESA' },
    { header: 'REGISTRO', width: '100px' },
    { header: 'TOTAL VENTA', width: '130px' },
    { header: 'ACCIONES', width: '120px', align: 'center' },
    { header: 'ESTADO', width: '140px', align: 'center' }
  ];

  return (
    <div className="caja-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* 1. FILA DE TARJETAS DE MÉTRICAS PRINCIPALES */}
      <div className="caja-metrics-grid">
        {/* Card 1: Fondo de Apertura */}
        <div className="caja-metric-card apertura">
          <span className="metric-label">FONDO DE APERTURA</span>
          <h2 className="metric-value">S/ {cajaState.fondoApertura.toFixed(2)}</h2>
        </div>

        {/* Card 2: Ventas del Turno */}
        <div className="caja-metric-card ventas">
          <span className="metric-label">VENTAS DEL TURNO</span>
          <h2 className="metric-value">S/ {cajaState.ventasTurno.toFixed(2)}</h2>
        </div>

        {/* Card 3: Saldo Esperado en Caja */}
        <div className="caja-metric-card esperado">
          <span className="metric-label">SALDO ESPERADO EN CAJA</span>
          <h2 className="metric-value">S/ {saldoEsperadoTotal.toFixed(2)}</h2>
        </div>
      </div>

      {/* 2. SUB-PANEL DE DESGLOSE DE MÉTODOS DE PAGO Y MOVER MANUAL */}
      <div className="caja-subpanel-grid">
        {/* Efectivo Gaveta */}
        <div className="subpanel-card efectivo">
          <div className="subpanel-header">
            <span className="subpanel-title">EFECTIVO GAVETA</span>
            <div className="subpanel-icon-circle green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v2z"/>
              </svg>
            </div>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.efectivoGaveta.toFixed(2)}</h3>
        </div>

        {/* Balance Yape */}
        <div className="subpanel-card yape">
          <div className="subpanel-header">
            <span className="subpanel-title">BALANCE YAPE</span>
            <span className="badge-app-pill yape">yape</span>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.balanceYape.toFixed(2)}</h3>
        </div>

        {/* Balance Plin */}
        <div className="subpanel-card plin">
          <div className="subpanel-header">
            <span className="subpanel-title">BALANCE PLIN</span>
            <span className="badge-app-pill plin">plin</span>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.balancePlin.toFixed(2)}</h3>
        </div>

        {/* Por Tarjeta */}
        <div className="subpanel-card tarjeta">
          <div className="subpanel-header">
            <span className="subpanel-title">POR TARJETA</span>
            <div className="subpanel-icon-circle blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.porTarjeta.toFixed(2)}</h3>
        </div>

        {/* Mover Manual Contador */}
        <div className="subpanel-card mover-manual">
          <div className="subpanel-header">
            <span className="subpanel-title">MOVER MANUAL</span>
          </div>
          <div className="mover-manual-counts">
            <div className="count-row ingreso">
              <span className="count-arrow">↓</span>
              <span>Ingresos:</span>
              <strong className="count-val">{cajaState.ingresosManualesCount}</strong>
            </div>
            <div className="count-row egreso">
              <span className="count-arrow">↑</span>
              <span>Egresos:</span>
              <strong className="count-val">{cajaState.egresosManualesCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BOTONES DE ACCIÓN OPERATIVA */}
      <div className="caja-toolbar-actions">
        {/* Movimiento Manual */}
        <button className="btn-caja-action dark" onClick={() => setShowMovimientoModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Movimiento Manual
        </button>

        {/* Cerrar Caja Operativa */}
        <button className="btn-caja-action guinda" onClick={handleSolicitarCierreCaja}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Cerrar Caja Operativa
        </button>

        {/* Exportar PDF */}
        <button className="btn-caja-action export pdf" onClick={() => setToast({ type: 'info', title: 'Exportando PDF', message: 'Generando reporte de arqueo...' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          PDF
        </button>

        {/* Exportar Excel */}
        <button className="btn-caja-action export excel" onClick={() => setToast({ type: 'info', title: 'Exportando Excel', message: 'Descargando hoja de cálculo...' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          Excel
        </button>
      </div>

      {/* 4. TABLA DE ÓRDENES Y BITÁCORA CON PESTAÑAS */}
      <div className="caja-table-wrapper">
        {/* Pestañas de Navegación de Caja */}
        <div className="caja-tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'POR_COBRAR' ? 'active' : ''}`}
            onClick={() => setActiveTab('POR_COBRAR')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Por Cobrar ({ordenesPorCobrar.length})
          </button>

          <button
            className={`tab-btn ${activeTab === 'LIQUIDADOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('LIQUIDADOS')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Liquidados Turno ({ordenesLiquidadas.length})
          </button>

          <button
            className={`tab-btn ${activeTab === 'BITACORA' ? 'active' : ''}`}
            onClick={() => setActiveTab('BITACORA')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Bitácora Caja
          </button>
        </div>

        {/* Vista Pestaña 1: Por Cobrar */}
        {activeTab === 'POR_COBRAR' && (
          <DataTable
            columns={COLUMNAS_POR_COBRAR}
            data={ordenesPorCobrar}
            itemsPerPage={5}
            emptyMessage="No hay órdenes pendientes por cobrar en este momento."
            renderRow={(orden) => (
              <tr key={orden.id}>
                <td><span className="orden-id-bold">{orden.id}</span></td>
                <td>
                  <span className="servicio-pill">
                    <span className="dollar-icon">$</span> {orden.servicio}
                  </span>
                </td>
                <td><span className="mesa-text">{orden.mesa}</span></td>
                <td><span className="hora-pill">{orden.registro}</span></td>
                <td><span className="total-venta-text">S/ {orden.total.toFixed(2)}</span></td>
                <td>
                  <div className="acciones-buttons-group">
                    {/* Ver Detalle Orden */}
                    <button
                      className="btn-action-icon view"
                      title="Ver detalle de comandas"
                      onClick={() => { setOrdenSeleccionada(orden); setShowDetalleOrdenModal(true); }}
                    >
                      <EyeIcon />
                    </button>

                    {/* Botón Cobrar (Tarjeta Verde / Cobrar) */}
                    <button
                      className="btn-action-icon cobrar"
                      title="Cobrar orden"
                      onClick={() => handleAbrirCobro(orden)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                      </svg>
                    </button>
                  </div>
                </td>
                <td>
                  <span className="badge-por-cobrar">
                    POR COBRAR
                  </span>
                </td>
              </tr>
            )}
          />
        )}

        {/* Vista Pestaña 2: Liquidados */}
        {activeTab === 'LIQUIDADOS' && (
          <div className="liquidados-table-container">
            <DataTable
              columns={[
                { header: 'ID ORDEN', width: '90px' },
                { header: 'SERVICIO' },
                { header: 'MESA' },
                { header: 'MÉTODO DE PAGO' },
                { header: 'HORA PAGO' },
                { header: 'TOTAL' }
              ]}
              data={ordenesLiquidadas}
              itemsPerPage={5}
              emptyMessage="Aún no se han cobrado órdenes en este turno."
              renderRow={(ord) => (
                <tr key={ord.id}>
                  <td><span className="orden-id-bold">{ord.id}</span></td>
                  <td>{ord.servicio}</td>
                  <td>{ord.mesa}</td>
                  <td><span className={`metodo-badge ${ord.metodoPago?.toLowerCase()}`}>{ord.metodoPago}</span></td>
                  <td>{ord.horaPago}</td>
                  <td><span className="total-venta-text">S/ {ord.total.toFixed(2)}</span></td>
                </tr>
              )}
            />
          </div>
        )}

        {/* Vista Pestaña 3: Bitácora de Movimientos */}
        {activeTab === 'BITACORA' && (
          <div className="bitacora-container">
            <DataTable
              columns={[
                { header: 'HORA' },
                { header: 'TIPO' },
                { header: 'MOTIVO / CONCEPTO' },
                { header: 'MONTO' }
              ]}
              data={bitacoraMovimientos}
              itemsPerPage={5}
              emptyMessage="Sin movimientos manuales registrados en el turno."
              renderRow={(mov) => (
                <tr key={mov.id}>
                  <td>{mov.hora}</td>
                  <td>
                    <span className={`tipo-mov-pill ${mov.tipo.toLowerCase()}`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td>{mov.motivo}</td>
                  <td>
                    <span className={`monto-mov-text ${mov.tipo.toLowerCase()}`}>
                      {mov.tipo === 'INGRESO' ? '+' : '-'} S/ {mov.monto.toFixed(2)}
                    </span>
                  </td>
                </tr>
              )}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: PROCESAR COBRO DE ORDEN */}
      <Modal
        isOpen={showCobroModal}
        onClose={() => setShowCobroModal(false)}
        title={ordenSeleccionada ? `Cobrar Orden ${ordenSeleccionada.id} - ${ordenSeleccionada.mesa}` : 'Procesar Cobro'}
        maxWidth="560px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
      >
        <form onSubmit={handleProcesarCobro}>
          <div className="modal-body-custom cobro-body">
            
            {/* Resumen Total a Cobrar */}
            <div className="total-cobro-banner">
              <span>TOTAL A COBRAR:</span>
              <h2>S/ {ordenSeleccionada?.total.toFixed(2)}</h2>
            </div>

            {/* Selector de Método de Pago */}
            <div className="form-group-custom">
              <label className="label-senior">1. Seleccione Método de Pago:</label>
              <div className="metodos-pago-grid">
                <button
                  type="button"
                  className={`btn-metodo ${cobroForm.metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                  onClick={() => setCobroForm({ ...cobroForm, metodoPago: 'EFECTIVO' })}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  className={`btn-metodo yape ${cobroForm.metodoPago === 'YAPE' ? 'active' : ''}`}
                  onClick={() => setCobroForm({ ...cobroForm, metodoPago: 'YAPE' })}
                >
                  Yape
                </button>
                <button
                  type="button"
                  className={`btn-metodo plin ${cobroForm.metodoPago === 'PLIN' ? 'active' : ''}`}
                  onClick={() => setCobroForm({ ...cobroForm, metodoPago: 'PLIN' })}
                >
                  Plin
                </button>
                <button
                  type="button"
                  className={`btn-metodo tarjeta ${cobroForm.metodoPago === 'TARJETA' ? 'active' : ''}`}
                  onClick={() => setCobroForm({ ...cobroForm, metodoPago: 'TARJETA' })}
                >
                  Tarjeta
                </button>
              </div>
            </div>

            {/* Si es Efectivo, pedir Monto Recibido y calcular Vuelto */}
            {cobroForm.metodoPago === 'EFECTIVO' && (
              <div className="efectivo-calculo-box">
                <div className="form-group-custom">
                  <label className="label-senior">Monto Recibido del Cliente (S/):</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    className="input-senior"
                    value={cobroForm.montoRecibido}
                    onChange={(e) => handleMontoRecibidoChange(e.target.value)}
                  />
                </div>

                <div className="vuelto-display">
                  <span>VUELTO A ENTREGAR:</span>
                  <strong className={cobroForm.vuelto > 0 ? 'con-vuelto' : ''}>
                    S/ {cobroForm.vuelto.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowCobroModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Confirmar Cobro
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: MOVIMIENTO MANUAL DE CAJA (INGRESO / EGRESO) */}
      <Modal
        isOpen={showMovimientoModal}
        onClose={() => setShowMovimientoModal(false)}
        title="Registrar Movimiento Manual"
        maxWidth="500px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        }
      >
        <form onSubmit={handleGuardarMovimientoManual}>
          <div className="modal-body-custom compact">
            
            {/* Tipo de Movimiento */}
            <div className="form-group-custom">
              <label className="label-senior">Tipo de Movimiento:</label>
              <div className="tipo-mov-grid">
                <button
                  type="button"
                  className={`btn-tipo-mov ingreso ${movimientoForm.tipo === 'INGRESO' ? 'active' : ''}`}
                  onClick={() => setMovimientoForm({ ...movimientoForm, tipo: 'INGRESO' })}
                >
                  ↓ Ingreso (+ S/)
                </button>
                <button
                  type="button"
                  className={`btn-tipo-mov egreso ${movimientoForm.tipo === 'EGRESO' ? 'active' : ''}`}
                  onClick={() => setMovimientoForm({ ...movimientoForm, tipo: 'EGRESO' })}
                >
                  ↑ Egreso (- S/)
                </button>
              </div>
            </div>

            {/* Monto */}
            <div className="form-group-custom">
              <label className="label-senior">Monto (S/):</label>
              <input
                type="number"
                step="0.50"
                required
                className="input-senior"
                placeholder="0.00"
                value={movimientoForm.monto}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, monto: e.target.value })}
              />
            </div>

            {/* Motivo */}
            <div className="form-group-custom">
              <label className="label-senior">Motivo o Concepto:</label>
              <input
                type="text"
                required
                className="input-senior"
                placeholder="Ej. Sencillo de caja, pago de gas, delivery..."
                value={movimientoForm.motivo}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
              />
            </div>

          </div>

          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowMovimientoModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VER DETALLE DE ORDEN */}
      <Modal
        isOpen={showDetalleOrdenModal}
        onClose={() => setShowDetalleOrdenModal(false)}
        title={ordenSeleccionada ? `Detalle Comanda: ${ordenSeleccionada.id}` : 'Detalle Orden'}
        maxWidth="480px"
      >
        {ordenSeleccionada && (
          <div className="modal-body-custom compact">
            <div className="usuario-detalle-card">
              <div className="detalle-row">
                <span className="detalle-label">Mesa / Servicio:</span>
                <span className="detalle-val font-bold">{ordenSeleccionada.mesa} ({ordenSeleccionada.servicio})</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Hora de Registro:</span>
                <span className="detalle-val">{ordenSeleccionada.registro}</span>
              </div>
              
              <div className="comanda-items-list">
                <span className="label-senior">Items de la Comanda:</span>
                {ordenSeleccionada.items.map((it, i) => (
                  <div key={i} className="item-row">
                    <span>{it.cant}x {it.nombre}</span>
                    <strong>S/ {(it.cant * it.precio).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="detalle-row total">
                <span className="detalle-label">Total a Pagar:</span>
                <span className="detalle-val total-price">S/ {ordenSeleccionada.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-save-senior" onClick={() => setShowDetalleOrdenModal(false)}>
            Cerrar
          </button>
        </div>
      </Modal>

      {/* CONFIRMDIALOG DE CIERRE */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText="Sí, Cerrar Caja"
        cancelText="Continuar Operando"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CajaPage;