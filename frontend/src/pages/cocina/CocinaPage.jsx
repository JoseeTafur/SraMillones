import React, { useState, useEffect } from 'react';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './CocinaPage.css';

export const CocinaPage = () => {
  const [toast, setToast] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS', 'EN_PREPARACION', 'LISTO', 'EN_ESPERA'
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null });

  // Lista simulada de comandas en cocina
  const [ordenes, setOrdenes] = useState([
    {
      id: 1,
      ticketNum: '#T-0012',
      mesa: '3',
      horaPedido: '14:20',
      minutosTranscurridos: 12,
      estadoGeneral: 'EN_PREPARACION',
      platillos: [
        { id: 101, nombre: 'Lomo Saltado', notas: 'Poco hecho', estado: 'EN_PREPARACION' },
        { id: 102, nombre: 'Arroz Chaufa de Pollo', notas: '', estado: 'EN_PREPARACION' },
        { id: 103, nombre: 'Inca Kola (1L)', notas: '', estado: 'LISTO' }
      ]
    },
    {
      id: 2,
      ticketNum: '#T-0013',
      mesa: '7',
      horaPedido: '14:24',
      minutosTranscurridos: 8,
      estadoGeneral: 'EN_PREPARACION',
      platillos: [
        { id: 201, nombre: 'Pollo a la Brasa', notas: 'Con papas crujientes', estado: 'EN_PREPARACION' },
        { id: 202, nombre: 'Ensalada César', notas: '', estado: 'EN_PREPARACION' },
        { id: 203, nombre: 'Chicha Morada 1L', notas: '', estado: 'LISTO' }
      ]
    },
    {
      id: 3,
      ticketNum: '#T-0010',
      mesa: '2',
      horaPedido: '14:12',
      minutosTranscurridos: 18,
      estadoGeneral: 'LISTO',
      platillos: [
        { id: 301, nombre: 'Papa a la Huancaína', notas: '', estado: 'LISTO' },
        { id: 302, nombre: 'Causa de Pollo', notas: '', estado: 'LISTO' }
      ]
    },
    {
      id: 4,
      ticketNum: '#T-0015',
      mesa: '4',
      horaPedido: '14:30',
      minutosTranscurridos: 3,
      estadoGeneral: 'EN_ESPERA',
      platillos: [
        { id: 401, nombre: 'Pescado a lo Macho', notas: 'Con arroz blanco', estado: 'EN_ESPERA' },
        { id: 402, nombre: 'Sopa a la Criolla', notas: '', estado: 'EN_ESPERA' }
      ]
    }
  ]);

  // Timer para incrementar los minutos transcurridos
  useEffect(() => {
    const timer = setInterval(() => {
      setOrdenes(prev => prev.map(ord => ({
        ...ord,
        minutosTranscurridos: ord.minutosTranscurridos + 1
      })));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Cambiar estado individual de un plato dentro de una comanda
  const handleToggleEstadoPlato = (ordenId, platoId) => {
    setOrdenes(prev => prev.map(ord => {
      if (ord.id === ordenId) {
        const nuevosPlatos = ord.platillos.map(p => {
          if (p.id === platoId) {
            const nuevoEstado = p.estado === 'LISTO' ? 'EN_PREPARACION' : 'LISTO';
            return { ...p, estado: nuevoEstado };
          }
          return p;
        });

        // Verificar si todos los platos están listos para actualizar la tarjeta completa
        const todosListos = nuevosPlatos.every(p => p.estado === 'LISTO');
        return {
          ...ord,
          platillos: nuevosPlatos,
          estadoGeneral: todosListos ? 'LISTO' : 'EN_PREPARACION'
        };
      }
      return ord;
    }));
  };

  // Simular impresión de comanda en ticketera
  const handleImprimirComanda = (orden) => {
    setToast({
      type: 'info',
      title: 'Imprimiendo Ticket...',
      message: `Enviando orden de Mesa #${orden.mesa} (${orden.ticketNum}) a la ticketera de cocina.`
    });
  };

  // Solicitar despachar/finalizar comanda completa
  const handleSolicitarDespacho = (ordenId) => {
    setConfirmDialog({ isOpen: true, orderId: ordenId });
  };

  const handleConfirmarDespacho = () => {
    setOrdenes(prev => prev.filter(o => o.id !== confirmDialog.orderId));
    setConfirmDialog({ isOpen: false, orderId: null });
    setToast({
      type: 'info',
      title: 'Comanda Despachada',
      message: 'La orden fue entregada al mozo para su servicio en mesa.'
    });
  };

  // Filtrado de tarjetas según pestaña activa
  const ordenesFiltradas = ordenes.filter(o => {
    if (filtroEstado === 'TODOS') return true;
    return o.estadoGeneral === filtroEstado;
  });

  // Contadores
  const countPreparacion = ordenes.filter(o => o.estadoGeneral === 'EN_PREPARACION').length;
  const countListo = ordenes.filter(o => o.estadoGeneral === 'LISTO').length;
  const countEspera = ordenes.filter(o => o.estadoGeneral === 'EN_ESPERA').length;

  return (
    <div className="cocina-page-container">
      {/* Toast Flotante */}
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
            const esRetrasado = orden.minutosTranscurridos > 15;
            const esListo = orden.estadoGeneral === 'LISTO';

            return (
              <div key={orden.id} className={`comanda-card-box ${orden.estadoGeneral.toLowerCase()} ${esRetrasado ? 'retrasado' : ''}`}>
                {/* Cabecera Tarjeta */}
                <div className="comanda-card-header">
                  <div className="card-mesa-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path>
                    </svg>
                    <h3>Mesa #{orden.mesa}</h3>
                  </div>

                  <div className="card-meta-right">
                    <span className="ticket-id">{orden.ticketNum}</span>
                    <span className={`timer-pill ${esRetrasado ? 'danger' : ''} ${esListo ? 'success' : ''}`}>
                      ⏱ {orden.minutosTranscurridos} min
                    </span>
                  </div>
                </div>

                {/* Lista de Platos en la Comanda */}
                <div className="comanda-platillos-list">
                  {orden.platillos.map(item => {
                    const itemListo = item.estado === 'LISTO';
                    return (
                      <div key={item.id} className={`platillo-item-row ${itemListo ? 'platillo-listo' : ''}`}>
                        <div className="p-left">
                          <span className="p-cant">1x</span>
                          <div className="p-details">
                            <span className="p-nombre">{item.nombre}</span>
                            {item.notas && <span className="p-notas">• {item.notas}</span>}
                          </div>
                        </div>

                        <button
                          className={`btn-estado-platillo ${itemListo ? 'btn-listo' : 'btn-preparar'}`}
                          onClick={() => handleToggleEstadoPlato(orden.id, item.id)}
                        >
                          {itemListo ? '✔ Listo' : 'En preparación'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Info & Acciones */}
                <div className="comanda-card-footer">
                  <div className="footer-info-row">
                    <span>Pedido: <strong>{orden.horaPedido}</strong></span>
                    <span>Cliente: <strong>Mesa #{orden.mesa}</strong></span>
                  </div>

                  <div className="footer-actions-row">
                    <button
                      className="btn-print-ticket"
                      onClick={() => handleImprimirComanda(orden)}
                    >
                      🖨 REIMPRIMIR
                    </button>

                    {esListo && (
                      <button
                        className="btn-despachar-final"
                        onClick={() => handleSolicitarDespacho(orden.id)}
                      >
                        ✔ DESPACHAR MESA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMAR DESPACHO COMPLETO DE COMANDA */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirmar Despacho"
        message="¿Desea marcar esta comanda como entregada y retirarla del monitor de cocina?"
        confirmText="Sí, Despachar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={handleConfirmarDespacho}
        onCancel={() => setConfirmDialog({ isOpen: false, orderId: null })}
      />
    </div>
  );
};

export default CocinaPage;