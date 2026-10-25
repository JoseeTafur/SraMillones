import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { cajaService } from '../../services/cajaService';
import './CajaGeneralView.css';

export const CajaGeneralView = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Rango de fechas por defecto
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos del Servidor
  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [metricasConsolidadas, setMetricasConsolidadas] = useState({
    totalVendido: 0,
    totalEfectivo: 0,
    totalDigital: 0,
    totalEgresos: 0,
    turnosCerradosCount: 0
  });

  const [activeAuditTab, setActiveAuditTab] = useState('LIQUIDADOS');
  const [bitacoraTurno, setBitacoraTurno] = useState([]);

  // Modal para Inspección de Ventas del Turno (Ojito 👁️)
  const [showDetalleTurnoModal, setShowDetalleTurnoModal] = useState(false);
  const [selectedTurnoDetail, setSelectedTurnoDetail] = useState(null);
  const [loadingDetalleTurno, setLoadingDetalleTurno] = useState(false);
  const [ventasTurno, setVentasTurno] = useState([]);

  // Modal para Inspección de Productos de una Venta Específica
  const [showDetalleVentaModal, setShowDetalleVentaModal] = useState(false);
  const [detalleVentaData, setDetalleVentaData] = useState(null);
  const [loadingDetalleVenta, setLoadingDetalleVenta] = useState(false);

  const cargarHistorialGeneral = async () => {
    setLoading(true);
    try {
      const data = await cajaService.obtenerHistorialTurnos(fechaInicio, fechaFin);
      const turnos = Array.isArray(data) ? data : [];
      setHistorialTurnos(turnos);

      let vendido = 0;
      let efectivo = 0;
      let digital = 0;
      let egresos = 0;

      turnos.forEach(t => {
        const m = t.metricas || {};
        vendido += Number(m.totalVentas || 0);
        efectivo += Number(m.efectivoEsperadoGaveta || 0);
        digital += Number(m.ventasYape || 0) + Number(m.ventasPlin || 0) + Number(m.ventasTarjeta || 0);
        egresos += Number(m.egresosManuales || 0);
      });

      setMetricasConsolidadas({
        totalVendido: vendido,
        totalEfectivo: efectivo,
        totalDigital: digital,
        totalEgresos: egresos,
        turnosCerradosCount: turnos.length
      });
    } catch (err) {
      console.error("Error al cargar historial de caja general:", err);
      setToast({ type: 'error', title: 'Error de Red', message: 'No se pudo consultar el historial global de turnos.' });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Carga inicial al montar el componente únicamente
  useEffect(() => {

  }, []);

  // 👁️ Abrir Auditoría Completa de un Turno Histórico
  const handleVerDetalleTurno = async (turno) => {
    setSelectedTurnoDetail(turno);
    setShowDetalleTurnoModal(true);
    setLoadingDetalleTurno(true);
    setActiveAuditTab('LIQUIDADOS'); // Reiniciar a la primera pestaña
    try {
      const data = await cajaService.obtenerEstadoCajaPorTurno(turno.id);
      const movimientos = data?.metricas?.movimientos || [];
      
      // Separar Ventas de Bitácora
      const ventas = movimientos.filter(m => m.tipo === 'INGRESO_VENTA' || (m.concepto && m.concepto.toLowerCase().includes('venta')));
      const bitacora = movimientos.filter(m => m.tipo === 'APERTURA' || m.tipo === 'INGRESO_MANUAL' || m.tipo === 'EGRESO_MANUAL');
      
      setVentasTurno(ventas);
      setBitacoraTurno(bitacora);
    } catch (error) {
      console.error("Error al cargar auditoría del turno:", error);
      setToast({ type: 'error', title: 'Error', message: 'No se pudieron consultar los movimientos del turno.' });
    } finally {
      setLoadingDetalleTurno(false);
    }
  };

  // 👁️ Abrir Desglose de Productos
  const handleVerDetalleVenta = async (movimientoId) => {
    setLoadingDetalleVenta(true);
    setShowDetalleVentaModal(true);
    try {
      const data = await cajaService.obtenerDetalleVenta(movimientoId);
      setDetalleVentaData(data);
    } catch (error) {
      console.error("Error al consultar detalle de venta:", error);
      setToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el desglose de productos.' });
      setShowDetalleVentaModal(false);
    } finally {
      setLoadingDetalleVenta(false);
    }
  };

  const turnosFiltrados = historialTurnos.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const idStr = String(t.id);
    const obsStr = (t.observaciones || '').toLowerCase();
    const fechaStr = (t.fechaApertura || '').toLowerCase();
    return idStr.includes(term) || obsStr.includes(term) || fechaStr.includes(term);
  });

  return (
    <div className="caja-general-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER & FILTROS */}
      <div className="caja-general-header">
        <div className="header-titles">
          <h2>📊 Auditoría y Caja General</h2>
          <p>Consulta histórica de turnos cerrados, balance contable y arqueos globales.</p>
        </div>

        <div className="caja-general-range-filters">
          <div className="filter-date-group">
            <label>Desde:</label>
            <input
              type="date"
              className="input-senior date-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="filter-date-group">
            <label>Hasta:</label>
            <input
              type="date"
              className="input-senior date-input"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <button className="btn-caja-action dark" onClick={cargarHistorialGeneral}>
            🔄 Actualizar Reporte
          </button>
        </div>
      </div>

      {/* MÉTRICAS CONSOLIDADAS */}
      <div className="caja-metrics-grid">
        <div className="caja-metric-card ventas">
          <span className="metric-label">TOTAL FACTURADO</span>
          <h2 className="metric-value">S/ {metricasConsolidadas.totalVendido.toFixed(2)}</h2>
          <span className="metric-sub">{metricasConsolidadas.turnosCerradosCount} Turnos Auditados</span>
        </div>
        <div className="caja-metric-card apertura">
          <span className="metric-label">EFECTIVO RECAUDADO</span>
          <h2 className="metric-value">S/ {metricasConsolidadas.totalEfectivo.toFixed(2)}</h2>
          <span className="metric-sub">Fondo en Gaveta</span>
        </div>
        <div className="caja-metric-card esperado">
          <span className="metric-label">PAGOS DIGITALES / POS</span>
          <h2 className="metric-value">S/ {metricasConsolidadas.totalDigital.toFixed(2)}</h2>
          <span className="metric-sub">Yape, Plin y Tarjetas</span>
        </div>
        <div className="caja-metric-card mover-manual">
          <span className="metric-label">EGRESOS OPERATIVOS</span>
          <h2 className="metric-value" style={{ color: '#b91c1c' }}>S/ {metricasConsolidadas.totalEgresos.toFixed(2)}</h2>
          <span className="metric-sub">Gastos y Salidas Chica</span>
        </div>
      </div>

      {/* TABLA HISTÓRICA */}
      <div className="caja-table-wrapper">
        <div className="table-section-title-bar">
          <h3>📜 Historial de Turnos de Caja Registrados</h3>
        </div>

        <DataTable
          columns={[
            { header: 'ID TURNO' },
            { header: 'APERTURA Y CIERRE' },
            { header: 'FONDO INICIAL' },
            { header: 'VENTAS TOTALES' },
            { header: 'EFECTIVO CONTADO' },
            { header: 'DESCUADRE / DIF.' },
            { header: 'AUDITAR', align: 'center' }
          ]}
          data={turnosFiltrados}
          searchValue={searchTerm}
          onSearchChange={(val) => setSearchTerm(val)}
          itemsPerPage={8}
          emptyMessage={
            loading 
              ? "Consultando auditoría en el servidor..." 
              : "Seleccione el rango de fechas y presione 'Actualizar Reporte' para auditar los turnos."
          }
          renderRow={(turno) => {
            const m = turno.metricas || {};
            const descuadre = (turno.montoCierre || 0) - (m.efectivoEsperadoGaveta || 0);
            const hayDescuadre = Math.abs(descuadre) > 0.1;

            return (
              <tr key={turno.id}>
                <td><strong>#TURNO-{turno.id}</strong></td>
                <td>
                  <div className="cell-datetime-stack">
                    <span className="date-open">🟢 {turno.fechaApertura ? turno.fechaApertura.replace('T', ' ').substring(0, 16) : 'S/I'}</span>
                    <span className="date-close">🔴 {turno.fechaCierre ? turno.fechaCierre.replace('T', ' ').substring(0, 16) : 'Abierto'}</span>
                  </div>
                </td>
                <td>S/ {(turno.montoApertura || 0).toFixed(2)}</td>
                <td><strong style={{ color: '#15803d' }}>S/ {(m.totalVentas || 0).toFixed(2)}</strong></td>
                <td><strong>S/ {(turno.montoCierre || 0).toFixed(2)}</strong></td>
                <td>
                  <span className={`badge-descuadre-pill ${hayDescuadre ? (descuadre < 0 ? 'faltante' : 'sobrante') : 'exacto'}`}>
                    {descuadre === 0 ? '✓ Exacto' : `S/ ${descuadre.toFixed(2)}`}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-icon-view-detail"
                    title="Auditar ventas y movimientos de este turno"
                    onClick={() => handleVerDetalleTurno(turno)}
                  >
                    👁️
                  </button>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* MODAL 1: AUDITORÍA COMPLETA DEL TURNO SELECCIONADO */}
      <Modal
        isOpen={showDetalleTurnoModal}
        onClose={() => setShowDetalleTurnoModal(false)}
        title={`🔎 Auditoría de Caja — Turno #${selectedTurnoDetail?.id}`}
        maxWidth="900px"
      >
        <div className="modal-body-custom">
          {loadingDetalleTurno ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos del turno...</p>
          ) : (
            <div className="audit-turno-content">
              {/* Tarjetas de Resumen del Turno Auditado */}
              <div className="audit-summary-grid">
                <div className="audit-box">
                  <span>Apertura:</span>
                  <strong>S/ {(selectedTurnoDetail?.montoApertura || 0).toFixed(2)}</strong>
                </div>
                <div className="audit-box">
                  <span>Ventas Totales:</span>
                  <strong style={{ color: '#15803d' }}>S/ {(selectedTurnoDetail?.metricas?.totalVentas || 0).toFixed(2)}</strong>
                </div>
                <div className="audit-box">
                  <span>Efectivo Contado:</span>
                  <strong>S/ {(selectedTurnoDetail?.montoCierre || 0).toFixed(2)}</strong>
                </div>
                <div className="audit-box">
                  <span>Observación:</span>
                  <small>{selectedTurnoDetail?.observaciones || 'Sin observaciones'}</small>
                </div>
              </div>

              {/* BARRA DE PESTAÑAS DENTRO DE LA AUDITORÍA */}
              <div className="caja-tabs-bar" style={{ marginTop: '1.2rem', marginBottom: '1rem' }}>
                <button
                  className={`tab-btn ${activeAuditTab === 'LIQUIDADOS' ? 'active' : ''}`}
                  onClick={() => setActiveAuditTab('LIQUIDADOS')}
                >
                  Liquidados Turno ({ventasTurno.length})
                </button>
                <button
                  className={`tab-btn ${activeAuditTab === 'BITACORA' ? 'active' : ''}`}
                  onClick={() => setActiveAuditTab('BITACORA')}
                >
                  Bitácora ({bitacoraTurno.length})
                </button>
              </div>

              {/* PESTAÑA 1: LIQUIDADOS TURNO */}
              {activeAuditTab === 'LIQUIDADOS' && (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="audit-ventas-table">
                    <thead>
                      <tr>
                        <th>Comprobante</th>
                        <th>Concepto / Cliente</th>
                        <th>Método Pago</th>
                        <th>Monto</th>
                        <th style={{ textAlign: 'center' }}>Ver Platos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasTurno.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No hay ventas liquidadas en este turno.</td>
                        </tr>
                      ) : (
                        ventasTurno.map(v => (
                          <tr key={v.id}>
                            <td><strong>#{v.comprobante || v.id}</strong></td>
                            <td>{v.concepto}</td>
                            <td><span className="badge-metodo-pill">{v.metodoPago || 'EFECTIVO'}</span></td>
                            <td><strong style={{ color: '#15803d' }}>S/ {Math.abs(v.monto || 0).toFixed(2)}</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon-view-detail"
                                title="Ver platos de la venta (detalle_ventas)"
                                onClick={() => handleVerDetalleVenta(v.id)}
                              >
                                👁️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PESTAÑA 2: BITÁCORA DEL TURNO */}
              {activeAuditTab === 'BITACORA' && (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="audit-ventas-table">
                    <thead>
                      <tr>
                        <th>Comprobante</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bitacoraTurno.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>Sin movimientos de bitácora en este turno.</td>
                        </tr>
                      ) : (
                        bitacoraTurno.map(m => {
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer-custom elder-footer compact">
          <button className="btn-cancel-senior" onClick={() => setShowDetalleTurnoModal(false)}>
            Cerrar Auditoría
          </button>
        </div>
      </Modal>

      {/* MODAL 2: INSPECCIÓN DE PRODUCTOS */}
      <Modal
        isOpen={showDetalleVentaModal}
        onClose={() => setShowDetalleVentaModal(false)}
        title="📋 Desglose de Productos Vendidos"
        maxWidth="550px"
      >
        <div className="modal-body-custom">
          {loadingDetalleVenta ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando platillos desde el servidor...</p>
          ) : detalleVentaData ? (
            <div className="detalle-venta-container">
              <div className="detalle-header-banner" style={{ marginBottom: '1rem', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}><strong>Comprobante:</strong> {detalleVentaData.comprobante || 'S/N'}</p>
                <p style={{ margin: 0 }}><strong>Origen:</strong> {detalleVentaData.mesa}</p>
                <p style={{ margin: 0 }}><strong>Método Pago:</strong> {detalleVentaData.metodoPago}</p>
              </div>

              {(!detalleVentaData.detalles || detalleVentaData.detalles.length === 0) ? (
                <p style={{ color: '#64748b' }}>Sin ítems registrados.</p>
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
          <button className="btn-cancel-senior" onClick={() => setShowDetalleVentaModal(false)}>
            Volver
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CajaGeneralView;