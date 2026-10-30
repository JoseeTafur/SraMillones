import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MesaPagoModal from '../mesas/components/MesaPagoModal';
import { cajaService } from '../../services/cajaService';
import './CajaTurnoView.css';

export const CajaTurnoView = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('POR_COBRAR');

  // Estado del Turno
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoSugerido, setMontoSugerido] = useState(200);
  const [cajaState, setCajaState] = useState({
    fondoApertura: 200,
    totalVentas: 0,
    efectivoGaveta: 200,
    balanceYape: 0,
    balancePlin: 0,
    porTarjeta: 0,
    ingresosManuales: 0,
    egresosManuales: 0
  });

  const [ordenesPorCobrar, setOrdenesPorCobrar] = useState([]);
  const [ordenesLiquidadas, setOrdenesLiquidadas] = useState([]);
  const [bitacoraMovimientos, setBitacoraMovimientos] = useState([]);

  // Modal para la inspección con "Ojito" 👁️
  const [showDetalleVentaModal, setShowDetalleVentaModal] = useState(false);
  const [detalleVentaData, setDetalleVentaData] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modales generales
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [montoAperturaInput, setMontoAperturaInput] = useState('200');

  const [showMovModal, setShowMovModal] = useState(false);
  const [movForm, setMovForm] = useState({ tipo: 'EGRESO_MANUAL', concepto: '', monto: '' });

  const [showCierreModal, setShowCierreModal] = useState(false);
  const [cierreForm, setCierreForm] = useState({ montoCierre: '', observaciones: '' });

  // Modal Avanzado de Cobro
  const [showMesaPagoModal, setShowMesaPagoModal] = useState(false);
  const [selectedMesaPago, setSelectedMesaPago] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Confirmación
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  

  const cargarEstadoCaja = async () => {
    setLoading(true);
    try {
      const data = await cajaService.obtenerEstadoCaja();

      if (data && data.cajaAbierta) {
        setCajaAbierta(true);
        setShowAperturaModal(false);

        const m = data.metricas || {};
        setCajaState({
          fondoApertura: m.montoApertura || 200,
          totalVentas: m.totalVentas || 0,
          efectivoGaveta: m.efectivoEsperadoGaveta || 0,
          balanceYape: m.ventasYape || 0,
          balancePlin: m.ventasPlin || 0,
          porTarjeta: m.ventasTarjeta || 0,
          ingresosManuales: m.ingresosManuales || 0,
          egresosManuales: m.egresosManuales || 0
        });

        const todosMovimientos = m.movimientos || [];

        const liquidados = todosMovimientos.filter(mov => 
          mov.tipo === 'INGRESO_VENTA' || (mov.concepto && mov.concepto.toLowerCase().includes('venta'))
        );
        setOrdenesLiquidadas(liquidados);

        const bitacora = todosMovimientos.filter(mov => 
          mov.tipo === 'APERTURA' || mov.tipo === 'INGRESO_MANUAL' || mov.tipo === 'EGRESO_MANUAL'
        );
        setBitacoraMovimientos(bitacora);

        try {
          const comandas = await cajaService.obtenerComandasPorCobrar();
          
          const comandasFormateadas = (comandas || [])
            .map(c => {
              const detallesSinPagar = (c.detalles || []).filter(d => !d.pagado);

              const totalPendiente = detallesSinPagar.reduce((acc, d) => {
                const precio = d.precioUnitario || d.precio || 0;
                const cant = d.cantidad || 1;
                return acc + (d.subtotal || (precio * cant));
              }, 0);

              const comandaEstructurada = detallesSinPagar.map(d => ({
                id: d.id,
                nombre: d.nombreProducto || d.producto?.nombre || 'Platillo',
                cant: d.cantidad || 1,
                precio: d.precioUnitario || d.precio || 0
              }));

              return {
                id: c.id,
                comandaId: c.id,
                numero: c.numeroMesa || '0',
                servicio: c.tipoAtencion || 'SALÓN',
                mesa: c.numeroMesa ? `Mesa ${c.numeroMesa}` : 'Para Llevar',
                total: totalPendiente,
                comanda: comandaEstructurada,
                selectedItemsPay: comandaEstructurada.map(i => i.id)
              };
            })
            .filter(c => c.total > 0);

          setOrdenesPorCobrar(comandasFormateadas);
        } catch (errComandas) {
          console.error("Error al obtener comandas por cobrar:", errComandas);
        }

      } else {
        setCajaAbierta(false);
        setMontoSugerido(data?.montoSugerido || 200);
        setMontoAperturaInput(String(data?.montoSugerido || 200));
        setShowAperturaModal(true);
      }
    } catch (err) {
      console.error("Error al consultar el turno de caja:", err);
      setToast({ type: 'error', title: 'Error de Red', message: 'No se pudo consultar el estado de la caja.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadoCaja();
  }, []);

  // 👁️ Abrir Modal de Inspección de la Venta
  const handleVerDetalleVenta = async (movimiento) => {
    setLoadingDetalle(true);
    setShowDetalleVentaModal(true);
    try {
      const data = await cajaService.obtenerDetalleVenta(movimiento.id);
      setDetalleVentaData(data);
    } catch (error) {
      console.error("Error al consultar el detalle de venta:", error);
      setToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el desglose del comprobante.' });
      setShowDetalleVentaModal(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleAbrirModalCobro = (orden) => {
    setSelectedMesaPago(orden);
    setShowMesaPagoModal(true);
  };

  const handleConfirmarPagoMesa = (datosPago) => {
    setConfirmState({
      isOpen: true,
      title: `¿Confirmar liquidación para ${selectedMesaPago?.mesa}?`,
      message: `Se registrará el cobro de S/ ${selectedMesaPago?.total.toFixed(2)} dividido en ${datosPago.tickets.length} ticket(s).`,
      onConfirm: async () => {
        try {
          await cajaService.cobrarComanda(datosPago.comandaId, datosPago);
          setToast({
            type: 'info',
            title: '¡Venta Registrada!',
            message: 'Comanda cobrada correctamente y asentada en caja.'
          });
          setShowMesaPagoModal(false);
          setSelectedMesaPago(null);
          await cargarEstadoCaja();
        } catch (err) {
          setToast({
            type: 'error',
            title: 'Error de Procesamiento',
            message: err.response?.data?.message || 'Ocurrió un error al procesar el pago.'
          });
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

 const handleAbrirCaja = async (e, forzado = false, montoFijo = null) => {
    if (e) e.preventDefault();

    // 🟢 Aseguramos obtener el monto numérico exacto sin perderlo en reintentos
    const montoFinal = montoFijo !== null ? parseFloat(montoFijo) : parseFloat(montoAperturaInput);

    if (isNaN(montoFinal) || montoFinal < 0) {
      setToast({ 
        type: 'error', 
        title: 'Monto Inválido', 
        message: 'Ingrese un monto de apertura válido.' 
      });
      return;
    }

    try {
      const res = await cajaService.abrirCaja(montoFinal, forzado);
      if (res && res.success) {
        setToast({ type: 'info', title: 'Caja Aperturada', message: res.message });
        setShowAperturaModal(false);
        cargarEstadoCaja();
      }
    } catch (err) {
      const dataErr = err.response?.data;

      // 🟢 Capturamos el flag que envía el backend
      if (dataErr && dataErr.requiereConfirmacionForzada) {
        setConfirmState({
          isOpen: true,
          title: '⚠️ Apertura Forzada Requerida',
          message: dataErr.message || '¿Desea realizar la apertura forzada de caja?',
          type: 'warning',
          confirmText: 'Sí, Forzar Apertura',
          cancelText: 'Cancelar',
          onConfirm: () => {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            // Reintentamos pasando explicitamente el monto capturado y forzado = true
            handleAbrirCaja(null, true, montoFinal);
          }
        });
      } else {
        setToast({ 
          type: 'error', 
          title: 'Error de Apertura', 
          message: dataErr?.message || 'Error al aperturar la caja.' 
        });
      }
    }
  };

  const handleGuardarMovimiento = async (e) => {
    e.preventDefault();
    if (!movForm.concepto.trim() || !movForm.monto) return;

    try {
      await cajaService.registrarMovimiento(movForm.tipo, movForm.concepto.trim(), movForm.monto);
      setToast({ type: 'info', title: 'Movimiento Registrado', message: 'Movimiento asentado correctamente en la bitácora.' });
      setShowMovModal(false);
      setMovForm({ tipo: 'EGRESO_MANUAL', concepto: '', monto: '' });
      cargarEstadoCaja();
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Error al guardar el movimiento.' });
    }
  };

  const handleCerrarCaja = async (e) => {
    e.preventDefault();
    if (!cierreForm.montoCierre) return;

    try {
      const res = await cajaService.cerrarCaja(cierreForm.montoCierre, cierreForm.observaciones);
      if (res && res.success) {
        setToast({ type: 'info', title: 'Caja Cerrada', message: res.message });
        setShowCierreModal(false);
        setCierreForm({ montoCierre: '', observaciones: '' });
        cargarEstadoCaja();
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error de Cierre', message: err.response?.data?.message || 'Error al cerrar caja.' });
    }
  };

  if (loading) {
    return (
      <div className="caja-turno-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Cargando datos de caja desde el servidor...</p>
      </div>
    );
  }

  if (!cajaAbierta) {
    return (
      <div className="caja-turno-container">
        {toast && (
          <div className="toast-floating-container">
            <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}

        <div className="caja-cerrada-placeholder">
          <h2>🔒 La Caja se encuentra Cerrada</h2>
          <p>Para registrar cobros y ventas en SRA MILLONES, realice la apertura del turno diario.</p>
          <button className="btn-caja-action guinda" onClick={() => setShowAperturaModal(true)}>
            Aperturar Turno de Caja
          </button>
        </div>

        <Modal
          isOpen={showAperturaModal}
          onClose={() => setShowAperturaModal(false)}
          title="Apertura de Caja - SRA MILLONES"
          maxWidth="480px"
        >
          <form onSubmit={(e) => handleAbrirCaja(e, false)}>
            <div className="modal-body-custom">
              <p className="apertura-info-text">
                Fondo inicial sugerido (cierre anterior): <strong>S/ {montoSugerido.toFixed(2)}</strong>
              </p>
              <div className="form-group-custom">
                <label className="label-senior">FONDO DE APERTURA (EFECTIVO) *</label>
                <input
                  type="number"
                  step="0.10"
                  required
                  className="input-senior"
                  placeholder="0.00"
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer-custom elder-footer compact">
              <button type="submit" className="btn-save-senior">
                Confirmar y Abrir Turno
              </button>
            </div>
          </form>
        </Modal>

        {/* 🟢 RENDERIZADO DEL CONFIRM DIALOG CUANDO LA CAJA ESTÁ CERRADA */}
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          type={confirmState.type || "info"}
          confirmText={confirmState.confirmText || "Sí, Confirmar"}
          cancelText={confirmState.cancelText || "Cancelar"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  return (
    <div className="caja-turno-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="caja-metrics-grid">
        <div className="caja-metric-card apertura">
          <span className="metric-label">FONDO DE APERTURA</span>
          <h2 className="metric-value">S/ {cajaState.fondoApertura.toFixed(2)}</h2>
        </div>
        <div className="caja-metric-card ventas">
          <span className="metric-label">VENTAS DEL TURNO</span>
          <h2 className="metric-value">S/ {cajaState.totalVentas.toFixed(2)}</h2>
        </div>
        <div className="caja-metric-card esperado">
          <span className="metric-label">EFECTIVO ESPERADO</span>
          <h2 className="metric-value">S/ {cajaState.efectivoGaveta.toFixed(2)}</h2>
        </div>
      </div>

      {/* MÉTODOS DE PAGO */}
      <div className="caja-subpanel-grid">
        <div className="subpanel-card efectivo">
          <span className="subpanel-title">EFECTIVO GAVETA</span>
          <h3 className="subpanel-amount">S/ {cajaState.efectivoGaveta.toFixed(2)}</h3>
        </div>
        <div className="subpanel-card yape">
          <div className="subpanel-header">
            <span className="subpanel-title">YAPE</span>
            <span className="badge-app-pill yape">yape</span>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.balanceYape.toFixed(2)}</h3>
        </div>
        <div className="subpanel-card plin">
          <div className="subpanel-header">
            <span className="subpanel-title">PLIN</span>
            <span className="badge-app-pill plin">plin</span>
          </div>
          <h3 className="subpanel-amount">S/ {cajaState.balancePlin.toFixed(2)}</h3>
        </div>
        <div className="subpanel-card tarjeta">
          <span className="subpanel-title">TARJETA</span>
          <h3 className="subpanel-amount">S/ {cajaState.porTarjeta.toFixed(2)}</h3>
        </div>
        <div className="subpanel-card mover-manual">
          <span className="subpanel-title">MOV. MANUAL</span>
          <div className="mover-manual-counts">
            <div className="count-row ingreso">↓ In: <strong className="count-val">S/ {cajaState.ingresosManuales.toFixed(2)}</strong></div>
            <div className="count-row egreso">↑ Eg: <strong className="count-val">S/ {cajaState.egresosManuales.toFixed(2)}</strong></div>
          </div>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="caja-toolbar-actions">
        <button className="btn-caja-action dark" onClick={() => setShowMovModal(true)}>
          Movimiento Manual
        </button>
        <button className="btn-caja-action guinda" onClick={() => setShowCierreModal(true)}>
          🔒 Cerrar y Arquear Turno
        </button>
      </div>

      {/* TABLAS PESTAÑAS */}
      <div className="caja-table-wrapper">
        <div className="caja-tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'POR_COBRAR' ? 'active' : ''}`}
            onClick={() => setActiveTab('POR_COBRAR')}
          >
            Por Cobrar ({ordenesPorCobrar.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'LIQUIDADOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('LIQUIDADOS')}
          >
            Liquidados Turno ({ordenesLiquidadas.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'BITACORA' ? 'active' : ''}`}
            onClick={() => setActiveTab('BITACORA')}
          >
            Bitácora ({bitacoraMovimientos.length})
          </button>
        </div>

        {/* 1. POR COBRAR */}
        {activeTab === 'POR_COBRAR' && (
          <DataTable
            columns={[
              { header: 'ID ORDEN' },
              { header: 'SERVICIO' },
              { header: 'MESA' },
              { header: 'TOTAL PENDIENTE' },
              { header: 'ESTADO', align: 'center' },
              { header: 'ACCIONES', align: 'center' }
            ]}
            data={ordenesPorCobrar}
            itemsPerPage={5}
            emptyMessage="Sin órdenes pendientes de cobro."
            renderRow={(orden) => (
              <tr key={orden.id}>
                <td><strong>#{orden.id}</strong></td>
                <td>{orden.servicio}</td>
                <td>{orden.mesa}</td>
                <td><span className="precio-monto-destacado">S/ {orden.total.toFixed(2)}</span></td>
                <td><span className="badge-por-cobrar">POR COBRAR</span></td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn-save-senior compact"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    onClick={() => handleAbrirModalCobro(orden)}
                  >
                    💳 Cobrar S/ {orden.total.toFixed(2)}
                  </button>
                </td>
              </tr>
            )}
          />
        )}

        {/* 2. LIQUIDADOS TURNO (👁️ CON BOTÓN DE INSPECCIÓN) */}
        {activeTab === 'LIQUIDADOS' && (
          <DataTable
            columns={[
              { header: 'COMPROBANTE' },
              { header: 'CONCEPTO' },
              { header: 'MEDIO DE PAGO' },
              { header: 'MONTO COBRADO' },
              { header: 'FECHA Y HORA' },
              { header: 'VER DETALLE', align: 'center' }
            ]}
            data={ordenesLiquidadas}
            itemsPerPage={5}
            emptyMessage="No hay ventas liquidadas en este turno."
            renderRow={(v) => (
              <tr key={v.id}>
                <td><strong>#{v.comprobante || v.id}</strong></td>
                <td>{v.concepto}</td>
                <td>
                  <span className="badge-por-cobrar" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    {v.metodoPago || 'EFECTIVO'}
                  </span>
                </td>
                <td><strong style={{ color: '#15803d' }}>S/ {Math.abs(v.monto || 0).toFixed(2)}</strong></td>
                <td>{v.fecha ? v.fecha.replace('T', ' ').substring(0, 16) : ''}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-icon-view-detail"
                    title="Ver platos de la venta (detalle_ventas)"
                    onClick={() => handleVerDetalleVenta(v)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    👁️
                  </button>
                </td>
              </tr>
            )}
          />
        )}

        {/* 3. BITÁCORA */}
        {activeTab === 'BITACORA' && (
          <DataTable
            columns={[
              { header: 'COMPROBANTE' },
              { header: 'TIPO' },
              { header: 'CONCEPTO' },
              { header: 'MONTO' },
              { header: 'FECHA Y HORA' }
            ]}
            data={bitacoraMovimientos}
            itemsPerPage={5}
            emptyMessage="Sin movimientos manuales registrados en este turno."
            renderRow={(m) => {
              const esIngreso = m.tipo === 'INGRESO_MANUAL' || m.tipo === 'APERTURA';
              return (
                <tr key={m.id}>
                  <td><strong>#{m.comprobante || `MOV-${m.id}`}</strong></td>
                  <td>
                    <span className={`badge-estado-pill ${esIngreso ? 'activo' : 'inactivo'}`}>
                      {esIngreso ? '↓ Ingreso' : '↑ Egreso'}
                    </span>
                  </td>
                  <td>{m.concepto}</td>
                  <td><strong>S/ {Math.abs(m.monto || 0).toFixed(2)}</strong></td>
                  <td>{m.fecha ? m.fecha.replace('T', ' ').substring(0, 16) : ''}</td>
                </tr>
              );
            }}
          />
        )}
      </div>

      {/* 👁️ MODAL INSPECCIÓN DETALLE DE VENTAS (detalle_ventas) */}
      <Modal
        isOpen={showDetalleVentaModal}
        onClose={() => setShowDetalleVentaModal(false)}
        title="📋 Desglose de Productos Vendidos"
        maxWidth="600px"
      >
        <div className="modal-body-custom">
          {loadingDetalle ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Cargando productos desde el servidor...
            </div>
          ) : detalleVentaData ? (
            <div className="detalle-venta-container">
              <div className="detalle-header-banner" style={{ marginBottom: '1rem', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}><strong>Comprobante:</strong> {detalleVentaData.comprobante || 'S/N'}</p>
                <p style={{ margin: 0 }}><strong>Origen:</strong> {detalleVentaData.mesa}</p>
                <p style={{ margin: 0 }}><strong>Método Pago:</strong> {detalleVentaData.metodoPago}</p>
              </div>

              <h4 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>Platillos / Productos Consumidos:</h4>

              {(!detalleVentaData.detalles || detalleVentaData.detalles.length === 0) ? (
                <p style={{ color: '#64748b' }}>No hay registros de ítems individuales para este movimiento.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Cant.</th>
                      <th style={{ padding: '8px' }}>Producto</th>
                      <th style={{ padding: '8px' }}>P. Unit</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVentaData.detalles.map((d, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}><strong>{d.cantidad}x</strong></td>
                        <td style={{ padding: '8px' }}>{d.producto}</td>
                        <td style={{ padding: '8px' }}>S/ {parseFloat(d.precioUnitario).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}><strong>S/ {parseFloat(d.subtotal).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '1.2rem' }}>
                <span>TOTAL VENTA: </span>
                <strong style={{ color: '#15803d' }}>S/ {parseFloat(detalleVentaData.montoTotal || 0).toFixed(2)}</strong>
              </div>
            </div>
          ) : null}
        </div>
        <div className="modal-footer-custom elder-footer compact">
          <button type="button" className="btn-cancel-senior" onClick={() => setShowDetalleVentaModal(false)}>
            Cerrar
          </button>
        </div>
      </Modal>

      {/* MODALES EXISTENTES */}
      {showMesaPagoModal && selectedMesaPago && (
        <MesaPagoModal
          isOpen={showMesaPagoModal}
          onClose={() => setShowMesaPagoModal(false)}
          selectedMesa={selectedMesaPago}
          onConfirmPago={handleConfirmarPagoMesa}
          setToast={setToast}
        />
      )}

      <Modal
        isOpen={showMovModal}
        onClose={() => setShowMovModal(false)}
        title="Registrar Movimiento Manual"
        maxWidth="480px"
      >
        <form onSubmit={handleGuardarMovimiento}>
          <div className="modal-body-custom">
            <div className="form-group-custom">
              <label className="label-senior">TIPO DE MOVIMIENTO *</label>
              <select
                className="input-senior select-senior"
                value={movForm.tipo}
                onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}
              >
                <option value="EGRESO_MANUAL">↑ EGRESO / SALIDA DE DINERO</option>
                <option value="INGRESO_MANUAL">↓ INGRESO / ENTRADA EXTRA</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label className="label-senior">CONCEPTO O JUSTIFICACIÓN *</label>
              <input
                type="text"
                required
                className="input-senior"
                placeholder="Ej. Sencillo para mozos, compras verdulería..."
                value={movForm.concepto}
                onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })}
              />
            </div>

            <div className="form-group-custom">
              <label className="label-senior">MONTO S/ *</label>
              <input
                type="number"
                step="0.10"
                required
                className="input-senior"
                placeholder="0.00"
                value={movForm.monto}
                onChange={(e) => setMovForm({ ...movForm, monto: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowMovModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior">
              Guardar Movimiento
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCierreModal}
        onClose={() => setShowCierreModal(false)}
        title="Arqueo y Cierre Estricto de Caja"
        maxWidth="500px"
      >
        <form onSubmit={handleCerrarCaja}>
          <div className="modal-body-custom">
            <div className="cierre-resumen-box" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
              <span>Efectivo Esperado en Gaveta:</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: '#0f172a' }}>
                S/ {cajaState.efectivoGaveta.toFixed(2)}
              </strong>
            </div>

            <div className="form-group-custom">
              <label className="label-senior">MONTO FÍSICO CONTADO EN GAVETA *</label>
              <input
                type="number"
                step="0.10"
                required
                className="input-senior"
                placeholder="0.00"
                value={cierreForm.montoCierre}
                onChange={(e) => setCierreForm({ ...cierreForm, montoCierre: e.target.value })}
              />
            </div>

            <div className="form-group-custom">
              <label className="label-senior">OBSERVACIONES O JUSTIFICACIÓN</label>
              <textarea
                className="input-senior textarea-senior"
                rows={2}
                placeholder="Anotaciones de cierre..."
                value={cierreForm.observaciones}
                onChange={(e) => setCierreForm({ ...cierreForm, observaciones: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer-custom elder-footer compact">
            <button type="button" className="btn-cancel-senior" onClick={() => setShowCierreModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-senior guinda-theme">
              Confirmar Cierre de Caja
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type="info"
        confirmText="Sí, Confirmar Cobro"
        cancelText="Volver"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CajaTurnoView;