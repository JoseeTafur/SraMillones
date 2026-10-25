import React, { useState, useEffect } from 'react';
import cocinaService from '../../services/cocinaService';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './CocinaPage.css';

export const CocinaPage = () => {
  const [toast, setToast] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    orderId: null, 
    detalleId: null, 
    nombrePlato: '', 
    numeroMesa: '',
    tipoAccion: 'ITEM' // 'ITEM' | 'COMANDA'
  });
  const [ordenes, setOrdenes] = useState([]);

  // 🔄 Cargar comandas activas desde el backend
  const cargarComandas = async () => {
    try {
      const data = await cocinaService.obtenerPedidosActivos();
      setOrdenes(data || []);
    } catch (error) {
      mostrarToast('error', 'Error de red', 'No se pudieron recuperar los pedidos de cocina.');
    }
  };

  useEffect(() => {
    cargarComandas();
    const interval = setInterval(cargarComandas, 15000);
    return () => clearInterval(interval);
  }, []);

  // ⏱ Timer para recalcular visualmente el tiempo transcurrido desde la fecha de apertura
  const calcularMinutosTranscurridos = (fechaAperturaStr) => {
    if (!fechaAperturaStr) return 0;
    const creacion = new Date(fechaAperturaStr);
    const ahora = new Date();
    const diferenciaMs = ahora - creacion;
    return Math.max(0, Math.floor(diferenciaMs / 60000));
  };

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // 🖨 Procesar e imprimir ticket
  const handleImprimirComanda = async (orden) => {
    try {
      mostrarToast('info', 'Imprimiendo Ticket...', `Enviando orden a la ticketera de cocina.`);
      await cocinaService.obtainTicket(orden.id);
      await cargarComandas();
    } catch (error) {
      mostrarToast('error', 'Error de Impresión', 'No se pudo comunicar el cambio al servidor.');
    }
  };

  // 1. Abrir modal para Marcar Listo un plato individual
  const handleSolicitarMarcarListo = (ordenId, detalleId, nombrePlato, numeroMesa) => {
    setConfirmDialog({
      isOpen: true,
      orderId: ordenId,
      detalleId: detalleId,
      nombrePlato: nombrePlato,
      numeroMesa: numeroMesa ? `Mesa #${numeroMesa}` : 'Delivery / Llevar',
      tipoAccion: 'ITEM'
    });
  };

  // 2. Ejecutar la acción tras confirmar en el modal para plato individual
  const handleConfirmarMarcarListo = async () => {
    const { orderId, detalleId } = confirmDialog;
    try {
      await cocinaService.completarItemIndividual(orderId, detalleId);
      
      setOrdenes(prev => prev.map(ord => {
        if (ord.id === orderId) {
          const listaDetalles = ord.detalles || ord.listaDetalles || [];
          const nuevosDetalles = listaDetalles.map(d => {
            if (d.id === detalleId) {
              return { ...d, cocinado: true, entregado: true };
            }
            return d;
          });
          
          const todosListos = nuevosDetalles.every(d => d.canceladoPorCliente || d.cocinado);
          return {
            ...ord,
            detalles: nuevosDetalles,
            estado: todosListos ? 'PREPARADO' : ord.estado
          };
        }
        return ord;
      }));
      
      mostrarToast('info', 'Plato Listo', 'El platillo fue marcado como listo y notificado.');
    } catch (error) {
      const errorMsg = error.response?.data || 'No se pudo registrar el cambio en el servidor.';
      mostrarToast('error', 'Error al despachar', errorMsg);
    } finally {
      cerrarModalConfirmacion();
    }
  };

  // 3. Abrir modal para Despachar Comanda Completa
  const handleSolicitarDespachoComanda = (ordenId) => {
    setConfirmDialog({
      isOpen: true,
      orderId: ordenId,
      detalleId: null,
      nombrePlato: '',
      numeroMesa: '',
      tipoAccion: 'COMANDA'
    });
  };

  // 4. Ejecutar despacho de comanda completa
  const handleConfirmarDespachoComanda = async () => {
    try {
      await cocinaService.completarPedido(confirmDialog.orderId);
      setOrdenes(prev => prev.filter(o => o.id !== confirmDialog.orderId));
      mostrarToast('info', 'Comanda Despachada', 'La orden fue entregada para su servicio en mesa.');
    } catch (error) {
      mostrarToast('error', 'Error al despachar', 'No se pudo finalizar la comanda en el servidor.');
    } finally {
      cerrarModalConfirmacion();
    }
  };

  const cerrarModalConfirmacion = () => {
    setConfirmDialog({ 
      isOpen: false, 
      orderId: null, 
      detalleId: null, 
      nombrePlato: '', 
      numeroMesa: '', 
      tipoAccion: 'ITEM' 
    });
  };

  const ordenesFiltradas = ordenes.filter(o => {
    const listaDetalles = o.detalles || o.listaDetalles || [];
    const detallesPendientes = listaDetalles.filter(d => !d.canceladoPorCliente && !d.entregado);
    
    // Si la tarjeta ya no tiene platillos pendientes por despachar, no se dibuja en pantalla
    if (detallesPendientes.length === 0) return false;

    const todosListos = detallesPendientes.every(d => d.cocinado);
    const esEspera = o.estado === 'PENDIENTE';
    const esPreparacion = o.estado === 'EN_COCINA' && !todosListos;
    const esListo = o.estado === 'PREPARADO' || todosListos;

    if (filtroEstado === 'TODOS') return true;
    if (filtroEstado === 'EN_PREPARACION') return esPreparacion;
    if (filtroEstado === 'LISTO') return esListo;
    if (filtroEstado === 'EN_ESPERA') return esEspera;
    return true;
  });

  const countEspera = ordenes.filter(o => o.estado === 'PENDIENTE').length;
  const countListo = ordenes.filter(o => {
    const lista = o.detalles || o.listaDetalles || [];
    return lista.length > 0 && lista.every(d => d.canceladoPorCliente || d.cocinado);
  }).length;
  const countPreparacion = ordenes.length - countEspera - countListo;

  return (
    <div className="cocina-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* BANNER ENCABEZADO MONITOR DE COCINA */}
      <div className="cocina-header-banner">
        <div className="banner-title-box">
          <h2 className="banner-main-title">MONITOREO DE COCINA (KDS)</h2>
          <p className="banner-sub-text">Gestión y despacho de comandas en tiempo real</p>
        </div>

        <div className="cocina-pending-badge">
          <span className="flame-icon">🔥</span>
          <span>ORDENES EN PROCESO: <strong>{ordenes.length}</strong></span>
        </div>
      </div>

      {/* PESTAÑAS DE FILTRADO POR ESTADO */}
      <div className="cocina-tabs-bar">
        <button
          className={`cocina-tab-btn preparacion ${filtroEstado === 'EN_PREPARACION' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('EN_PREPARACION')}
        >
          <span className="tab-dot blue">●</span> En preparación
          <span className="tab-count">{countPreparacion}</span>
        </button>

        <button
          className={`cocina-tab-btn listo ${filtroEstado === 'LISTO' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('LISTO')}
        >
          <span className="tab-dot yellow">●</span> Listo para servir
          <span className="tab-count">{countListo}</span>
        </button>

        <button
          className={`cocina-tab-btn espera ${filtroEstado === 'EN_ESPERA' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('EN_ESPERA')}
        >
          <span className="tab-dot gray">●</span> En espera
          <span className="tab-count">{countEspera}</span>
        </button>

        <button
          className={`cocina-tab-btn todos ${filtroEstado === 'TODOS' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('TODOS')}
        >
          ⠿ Todos ({ordenes.length})
        </button>
      </div>

      {/* GRILLA DE TARJETAS DE COMANDA */}
      <div className="cocina-grid-layout">
        {ordenesFiltradas.length === 0 ? (
          <div className="cocina-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h3>No hay comandas pendientes en esta sección</h3>
            <p>Las nuevas órdenes enviadas desde la comandera aparecerán aquí.</p>
          </div>
        ) : (
          ordenesFiltradas.map(orden => {
            const fechaRef = orden.fechaApertura || orden.fechaCreacion;
            const minutos = calcularMinutosTranscurridos(fechaRef);
            const esRetrasado = minutos > 15;
            
            const listaDetalles = orden.detalles || orden.listaDetalles || [];
            const esListo = listaDetalles.length > 0 && listaDetalles.every(d => d.canceladoPorCliente || d.cocinado);
            
            const horaFormateada = fechaRef 
              ? new Date(fechaRef).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : '00:00';

            return (
              <div key={orden.id} className={`comanda-card-box ${esListo ? 'listo' : 'en_preparacion'} ${esRetrasado ? 'retrasado' : ''}`}>
                {/* Cabecera Tarjeta */}
                <div className="comanda-card-header">
                  <div className="card-mesa-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path>
                    </svg>
                    <h3>{orden.numeroMesa ? `Mesa #${orden.numeroMesa}` : 'Delivery / Llevar'}</h3>
                  </div>

                  <div className="card-meta-right">
                    <span className="ticket-id">#T-00{orden.id}</span>
                    <span className={`timer-pill ${esRetrasado ? 'danger' : ''} ${esListo ? 'success' : ''}`}>
                      ⏱ {minutos} min
                    </span>
                  </div>
                </div>

                {/* Lista de Platos Reales en la Comanda */}
                <div className="comanda-platillos-list">
                  {listaDetalles
                    .filter(item => !item.canceladoPorCliente && !item.entregado)
                    .map(item => {
                      const itemListo = item.cocinado;
                      
                      return (
                        <div key={item.id} className={`platillo-item-row ${itemListo ? 'platillo-listo' : ''}`}>
                          <div className="p-left">
                            <span className="p-cant">{item.cantidad}x</span>
                            <div className="p-details">
                              <span className="p-nombre">{item.producto?.nombre || item.nombreProducto || 'Plato'}</span>
                              {item.observaciones && <span className="p-notas">• {item.observaciones}</span>}
                            </div>
                          </div>

                          <button
                            className={`btn-estado-platillo ${itemListo ? 'btn-listo' : 'btn-preparar'}`}
                            disabled={itemListo}
                            onClick={() => handleSolicitarMarcarListo(
                              orden.id, 
                              item.id, 
                              item.producto?.nombre || item.nombreProducto || 'este plato', 
                              orden.numeroMesa
                            )}
                          >
                            {itemListo ? '✔ Listo' : 'Marcar Listo'}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Footer Info & Acciones */}
                <div className="comanda-card-footer">
                  <div className="footer-info-row">
                    <span>Pedido: <strong>{horaFormateada}</strong></span>
                    <span>Atención: <strong>Mesa #{orden.numeroMesa}</strong></span>
                  </div>

                  <div className="footer-actions-row">
                    <button
                      className="btn-print-ticket"
                      onClick={() => handleImprimirComanda(orden)}
                    >
                      🖨 TICKET
                    </button>

                    {esListo && (
                      <button
                        className="btn-despachar-final"
                        onClick={() => handleSolicitarDespachoComanda(orden.id)}
                      >
                        ✔ DESPACHAR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.tipoAccion === 'ITEM' ? "¿Confirmar despacho de plato?" : "Confirmar Despacho"}
        message={
          confirmDialog.tipoAccion === 'ITEM'
            ? `¿Desea marcar como listo "${confirmDialog.nombrePlato}" de la ${confirmDialog.numeroMesa}?`
            : "¿Desea marcar esta comanda como entregada y retirarla del monitor de cocina?"
        }
        confirmText={confirmDialog.tipoAccion === 'ITEM' ? "Sí, Marcar Listo" : "Sí, Despachar"}
        cancelText="Cancelar"
        type="warning"
        onConfirm={confirmDialog.tipoAccion === 'ITEM' ? handleConfirmarMarcarListo : handleConfirmarDespachoComanda}
        onCancel={cerrarModalConfirmacion}
      />
    </div>
  );
};

export default CocinaPage;