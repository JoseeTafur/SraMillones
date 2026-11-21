import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { EyeIcon } from '../../components/common/Icons';
import { pagoDigitalService } from '../../services/pagoDigitalService';
import './PagosDigitalesPage.css';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dyjnbddit/image/upload/';

const resolverUrlImagen = (imgUrl) => {
  if (!imgUrl) return null;
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
  return `${CLOUDINARY_BASE}${imgUrl}`;
};

export const PagosDigitalesPage = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const [voucherAmpliado, setVoucherAmpliado] = useState(null);

  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    tipo: null, // 'APROBAR' | 'ANULAR'
    pago: null,
    observacion: ''
  });

  // Contador de seguridad de 3 segundos
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  useEffect(() => {
    if (!modalConfirmacion.isOpen) {
      setSegundosRestantes(0);
      return;
    }

    setSegundosRestantes(3);
    const intervalo = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [modalConfirmacion.isOpen, modalConfirmacion.tipo, modalConfirmacion.pago]);

  const COLUMNAS_PAGOS = [
    { header: 'SOLICITUD', width: '115px' },
    { header: 'VOUCHER', width: '95px', align: 'center' },
    { header: 'CLIENTE Y OPERACIÓN', width: '240px' },
    { header: 'MÉTODO / MONTO', width: '150px' },
    { header: 'ESTADO', width: '130px' },
    { header: 'OBSERVACIÓN' },
    { header: 'ACCIONES', width: '190px', align: 'center' }
  ];

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const lista = await pagoDigitalService.listarTodos();
      const ordenados = [...lista].sort((a, b) => (b.id || 0) - (a.id || 0));
      setPagos(ordenados);
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Error de Conexión',
        message: error.response?.data?.message || 'No se pudieron cargar los comprobantes digitales.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const conteos = useMemo(() => ({
    PENDIENTE: pagos.filter(p => p.situacion === 'PENDIENTE').length,
    APROBADO: pagos.filter(p => p.situacion === 'APROBADO').length,
    ANULADO: pagos.filter(p => p.situacion === 'ANULADO').length,
    TODOS: pagos.length
  }), [pagos]);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter(p => {
      const coincideEstado = filtroEstado === 'TODOS' || p.situacion === filtroEstado;
      const txt = searchTerm.trim().toLowerCase();
      const coincideTexto =
        !txt ||
        (p.clienteNombre || '').toLowerCase().includes(txt) ||
        (p.numeroOperacion || '').toLowerCase().includes(txt) ||
        (p.numeroComprobante || '').toLowerCase().includes(txt) ||
        String(p.id || '').includes(txt);
      return coincideEstado && coincideTexto;
    });
  }, [pagos, filtroEstado, searchTerm]);

  const abrirConfirmacion = (tipo, pago) => {
    setModalConfirmacion({
      isOpen: true,
      tipo,
      pago,
      observacion: tipo === 'APROBAR' ? 'Abono verificado correctamente en cuenta.' : ''
    });
  };

  const cerrarConfirmacion = () => {
    if (procesando) return;
    setModalConfirmacion({ isOpen: false, tipo: null, pago: null, observacion: '' });
  };

  const handleConfirmarAccion = async (e) => {
    e.preventDefault();
    if (segundosRestantes > 0) return;

    const { tipo, pago, observacion } = modalConfirmacion;
    if (!pago) return;

    if (tipo === 'ANULAR' && !observacion.trim()) {
      setToast({
        type: 'error',
        title: 'Motivo Requerido',
        message: 'Indique brevemente el motivo por el cual se deniega este voucher.'
      });
      return;
    }

    setProcesando(true);
    try {
      if (tipo === 'APROBAR') {
        const res = await pagoDigitalService.aprobarPago(pago.id, observacion.trim());
        const notaGenerada = res?.data?.numeroComprobante || '';
        setToast({
          type: 'info',
          title: '¡Pago Aprobado!',
          message: `Solicitud #${pago.id} aprobada. ${notaGenerada ? `Nota emitida: ${notaGenerada}.` : 'Ingreso registrado en Caja.'}`
        });
      } else {
        await pagoDigitalService.anularPago(pago.id, observacion.trim());
        setToast({
          type: 'warning',
          title: 'Comprobante Denegado',
          message: `La solicitud #${pago.id} fue rechazada sin generar venta ni afectar caja.`
        });
      }
      cerrarConfirmacion();
      await cargarPagos();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Operación Rechazada',
        message: err.response?.data?.message || 'No se pudo procesar el comprobante.'
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="pagos-digitales-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Barra de Filtros por Estado */}
      <div className="pagos-tabs-bar">
        {[
          { key: 'PENDIENTE', label: 'Pendientes', count: conteos.PENDIENTE, badgeClass: 'pendiente' },
          { key: 'APROBADO', label: 'Aprobados', count: conteos.APROBADO, badgeClass: 'aprobado' },
          { key: 'ANULADO', label: 'Denegados', count: conteos.ANULADO, badgeClass: 'anulado' },
          { key: 'TODOS', label: 'Todos', count: conteos.TODOS, badgeClass: 'todos' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFiltroEstado(tab.key)}
            className={`pago-tab-btn ${filtroEstado === tab.key ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            <span className={`pago-tab-count ${tab.badgeClass}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* DATATABLE PAGOS DIGITALES */}
      <DataTable
        title="Bandeja de Validación de Pagos Digitales"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        }
        actionButtonText={loading ? 'Actualizando...' : 'Actualizar Lista'}
        onActionClick={cargarPagos}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por cliente, N° operación o nota..."
        columns={COLUMNAS_PAGOS}
        data={pagosFiltrados}
        itemsPerPage={6}
        emptyMessage={
          loading
            ? 'Cargando comprobantes digitales...'
            : 'No hay comprobantes registrados en esta vista.'
        }
        renderRow={(pago) => {
          const urlImg = resolverUrlImagen(pago.imgUrl);
          const esAnulado = pago.situacion === 'ANULADO';

          return (
            <tr key={pago.id} className={esAnulado ? 'tr-disabled' : ''}>
              {/* Secuencia de Pago Digital */}
              <td>
                <div className="pago-id-bold">Pago #{pago.id}</div>
                <div className="pago-venta-sub">{pago.tipoAtencion || 'DELIVERY'}</div>
              </td>

              {/* Miniatura Voucher */}
              <td style={{ textAlign: 'center' }}>
                {urlImg ? (
                  <button
                    type="button"
                    className="voucher-thumb-btn"
                    title="Clic para inspeccionar voucher completo"
                    onClick={() => setVoucherAmpliado(pago)}
                  >
                    <img src={urlImg} alt={`Voucher #${pago.id}`} className="voucher-thumb-img" />
                    <span className="voucher-thumb-overlay">
                      <EyeIcon />
                    </span>
                  </button>
                ) : (
                  <span className="voucher-sin-foto">Sin captura</span>
                )}
              </td>

              {/* Cliente y Nro Operación */}
              <td>
                <div className="pago-cliente-nombre">
                  {pago.clienteNombre || 'CLIENTE WEB'}
                </div>
                {pago.numeroOperacion && (
                  <div className="pago-operacion-tag">
                    Op: <span>{pago.numeroOperacion}</span>
                  </div>
                )}
                {pago.numeroComprobante && (
                  <div className="pago-nota-tag">{pago.numeroComprobante}</div>
                )}
              </td>

              {/* Método y Monto */}
              <td>
                <span className={`metodo-pill ${(pago.metodoPago || '').toLowerCase()}`}>
                  {pago.metodoPago || 'DIGITAL'}
                </span>
                <div className="pago-monto-text">
                  S/ {Number(pago.montoTotal || 0).toFixed(2)}
                </div>
              </td>

              {/* Estado */}
              <td>
                {pago.situacion === 'PENDIENTE' && (
                  <span className="badge-estado-pill pago-pendiente">Pendiente</span>
                )}
                {pago.situacion === 'APROBADO' && (
                  <span className="badge-estado-pill activo">Aprobado</span>
                )}
                {pago.situacion === 'ANULADO' && (
                  <span className="badge-estado-pill inactivo">Denegado</span>
                )}
              </td>

              {/* Observación */}
              <td>
                <span className="pago-obs-text">{pago.observacion || '—'}</span>
              </td>

              {/* Acciones */}
              <td>
                {pago.situacion === 'PENDIENTE' ? (
                  <div className="acciones-buttons-group">
                    <button
                      type="button"
                      className="btn-pago-aprobar"
                      title="Confirmar abono y emitir Nota de Venta"
                      onClick={() => abrirConfirmacion('APROBAR', pago)}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn-pago-denegar"
                      title="Rechazar comprobante falso o no recibido"
                      onClick={() => abrirConfirmacion('ANULAR', pago)}
                    >
                      Denegar
                    </button>
                  </div>
                ) : (
                  <div className="acciones-buttons-group">
                    {urlImg && (
                      <button
                        type="button"
                        className="btn-action-icon view"
                        title="Ver comprobante"
                        onClick={() => setVoucherAmpliado(pago)}
                      >
                        <EyeIcon />
                      </button>
                    )}
                    <span className="pago-procesado-label">Procesado</span>
                  </div>
                )}
              </td>
            </tr>
          );
        }}
      />

      {/* MODAL 1: VISOR AMPLIADO DE VOUCHER */}
      <Modal
        isOpen={Boolean(voucherAmpliado)}
        onClose={() => setVoucherAmpliado(null)}
        title={
          voucherAmpliado
            ? `Inspección de Comprobante — Solicitud #${voucherAmpliado.id}`
            : 'Inspección de Comprobante'
        }
        maxWidth="520px"
        icon={<EyeIcon />}
      >
        {voucherAmpliado && (
          <>
            <div className="modal-body-custom compact">
              <div className="voucher-inspector-header">
                <div>
                  <span className="detalle-label">Cliente:</span>{' '}
                  <strong>{voucherAmpliado.clienteNombre || 'CLIENTE WEB'}</strong>
                </div>
                <div>
                  <span className="detalle-label">Monto esperado:</span>{' '}
                  <strong className="monto-guinda">
                    S/ {Number(voucherAmpliado.montoTotal || 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="voucher-full-frame">
                <img
                  src={resolverUrlImagen(voucherAmpliado.imgUrl)}
                  alt="Voucher completo"
                  className="voucher-full-img"
                />
              </div>
            </div>

            <div className="modal-footer-custom elder-footer compact">
              {voucherAmpliado.situacion === 'PENDIENTE' ? (
                <>
                  <button
                    type="button"
                    className="btn-cancel-senior"
                    onClick={() => {
                      const p = voucherAmpliado;
                      setVoucherAmpliado(null);
                      abrirConfirmacion('ANULAR', p);
                    }}
                  >
                    Denegar Voucher
                  </button>
                  <button
                    type="button"
                    className="btn-save-senior"
                    onClick={() => {
                      const p = voucherAmpliado;
                      setVoucherAmpliado(null);
                      abrirConfirmacion('APROBAR', p);
                    }}
                  >
                    Aprobar Pago
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-save-senior"
                  onClick={() => setVoucherAmpliado(null)}
                >
                  Cerrar Visor
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* MODAL 2: CARTEL DE CONFIRMACIÓN CON TEMPORIZADOR DE 3 SEGUNDOS */}
      <Modal
        isOpen={modalConfirmacion.isOpen}
        onClose={cerrarConfirmacion}
        title={
          modalConfirmacion.tipo === 'APROBAR'
            ? 'Confirmar Aprobación de Pago Digital'
            : 'Denegar Comprobante Digital'
        }
        maxWidth="520px"
      >
        {modalConfirmacion.pago && (
          <form onSubmit={handleConfirmarAccion}>
            <div className="modal-body-custom permisos-modal-body">
              <div
                className={
                  modalConfirmacion.tipo === 'APROBAR'
                    ? 'permisos-warning-box'
                    : 'denegar-warning-box'
                }
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={
                    modalConfirmacion.tipo === 'APROBAR'
                      ? 'permisos-alert-icon'
                      : 'denegar-alert-icon'
                  }
                >
                  <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V10h2v2z" />
                </svg>
                <div className="permisos-warning-content">
                  {modalConfirmacion.tipo === 'APROBAR' ? (
                    <p>
                      Verifique en su aplicativo de <strong>{modalConfirmacion.pago.metodoPago}</strong> que el abono haya ingresado realmente. Al confirmar, se creará la <strong>Nota de Venta</strong> y se sumará al turno de Caja:
                    </p>
                  ) : (
                    <p>
                      Esta acción rechazará el comprobante definitivamente <strong>sin generar venta ni tocar la caja</strong>:
                    </p>
                  )}
                  <h4 className="rol-destacado-title">
                    Solicitud #{modalConfirmacion.pago.id} — S/{' '}
                    {Number(modalConfirmacion.pago.montoTotal || 0).toFixed(2)}
                    {modalConfirmacion.pago.numeroOperacion
                      ? ` (Op: ${modalConfirmacion.pago.numeroOperacion})`
                      : ''}
                  </h4>
                </div>
              </div>

              <div className="form-group-custom">
                <label className="label-senior">
                  {modalConfirmacion.tipo === 'APROBAR'
                    ? 'Observación de conformidad (opcional)'
                    : 'Motivo del rechazo *'}
                </label>
                <textarea
                  rows="3"
                  required={modalConfirmacion.tipo === 'ANULAR'}
                  className="input-senior textarea-senior"
                  placeholder={
                    modalConfirmacion.tipo === 'APROBAR'
                      ? 'Ej. Abono verificado en cuenta Yape...'
                      : 'Ej. El depósito no figura en cuenta / captura manipulada...'
                  }
                  value={modalConfirmacion.observacion}
                  onChange={(e) =>
                    setModalConfirmacion(prev => ({
                      ...prev,
                      observacion: e.target.value
                    }))
                  }
                ></textarea>
              </div>
            </div>

            <div className="modal-footer-custom elder-footer compact">
              <button
                type="button"
                className="btn-cancel-senior"
                onClick={cerrarConfirmacion}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando || segundosRestantes > 0}
                className={
                  modalConfirmacion.tipo === 'APROBAR'
                    ? 'btn-save-senior'
                    : 'btn-danger-senior'
                }
              >
                {procesando
                  ? 'Procesando...'
                  : segundosRestantes > 0
                  ? `Espere ${segundosRestantes}s para confirmar...`
                  : modalConfirmacion.tipo === 'APROBAR'
                  ? 'Sí, Aprobar y Emitir Nota'
                  : 'Sí, Denegar Comprobante'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PagosDigitalesPage;