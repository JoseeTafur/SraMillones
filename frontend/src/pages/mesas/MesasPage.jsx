import React, { useState } from 'react';
import MesaCard from '../../components/common/MesaCard';
import Toast from '../../components/common/Toast';
import MesaGestionModal from './components/MesaGestionModal';
import MesaPagoModal from './components/MesaPagoModal';
import ComanderaPage from './ComanderaPage';
import './MesasPage.css';

export const MesasPage = () => {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('SALON');
  const [vistaActual, setVistaActual] = useState('SALON'); // 'SALON' | 'COMANDERA'

  // Modales
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);

  // Lista simulada de Mesas con Comandas
  const [mesas, setMesas] = useState([
    {
      id: 1,
      numero: '1',
      estado: 'LISTO_PARA_PAGAR',
      comensales: 2,
      comanda: [{ id: 101, cant: 1, nombre: 'Lomo saltado', precio: 35.00, estado: 'Entregado' }]
    },
    {
      id: 2,
      numero: '2',
      estado: 'EN_COCINA',
      comensales: 3,
      comanda: [
        { id: 102, cant: 2, nombre: 'Causa Limeña', precio: 20.00, estado: 'En Cocina' },
        { id: 103, cant: 1, nombre: 'Ají de Gallina', precio: 20.00, estado: 'En Cocina' }
      ]
    },
    { id: 3, numero: '3', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 4, numero: '4', estado: 'LIBRE', comensales: 0, comanda: [] },
    {
      id: 5,
      numero: '5',
      estado: 'LISTO_PARA_PAGAR',
      comensales: 4,
      comanda: [
        { id: 104, cant: 2, nombre: 'Ceviche de Pescado', precio: 30.00, estado: 'Entregado' },
        { id: 105, cant: 1, nombre: 'Chicha Morada 1L', precio: 12.00, estado: 'Entregado' }
      ]
    },
    { id: 6, numero: '6', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 7, numero: '7', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 8, numero: '8', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 9, numero: '9', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 10, numero: '10', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 11, numero: '11', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 12, numero: '12', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 13, numero: '13', estado: 'LIBRE', comensales: 0, comanda: [] },
    { id: 14, numero: '14', estado: 'LIBRE', comensales: 0, comanda: [] }
  ]);

  const handleMesaClick = (mesa) => {
    setSelectedMesa(mesa);
    setShowGestionModal(true);
  };

  const handleAbrirPagoDesdeGestion = () => {
    if (!selectedMesa || selectedMesa.comanda.length === 0) {
      setToast({ type: 'error', title: 'Mesa Vacía', message: 'No hay consumos registrados para cobrar.' });
      return;
    }
    setShowGestionModal(false);
    setShowPagoModal(true);
  };

  // Abrir la Comandera de Mesero al presionar "Añadir Producto"
  const handleAbrirComanderaDesdeGestion = () => {
    setShowGestionModal(false);
    setVistaActual('COMANDERA');
  };

  // Guardar pedido desde Comandera y regresar automáticamente al Salón
  const handleGuardarComanda = (numeroMesa, nuevosItems, instrucciones) => {
    setMesas(prev => prev.map(m => {
      if (m.numero === numeroMesa) {
        return {
          ...m,
          estado: 'EN_COCINA',
          comanda: [...m.comanda, ...nuevosItems]
        };
      }
      return m;
    }));

    setToast({
      type: 'info',
      title: '¡Orden Enviada a Cocina!',
      message: `La comanda de la Mesa #${numeroMesa} fue enviada con éxito.`
    });
  };

  const handleConfirmarPagoMesa = (ticketsGenerados) => {
    setMesas(prev => prev.map(m => m.id === selectedMesa.id ? { ...m, estado: 'LIBRE', comanda: [] } : m));
    setToast({
      type: 'info',
      title: '¡Mesa Cobrada y Liquidada!',
      message: `Se emitieron ${ticketsGenerados.length} comprobante(s) correctamente. La Mesa #${selectedMesa.numero} quedó libre.`
    });
    setShowPagoModal(false);
  };

  // Renderizado condicional según vista
  if (vistaActual === 'COMANDERA') {
    return (
      <ComanderaPage
        mesa={selectedMesa}
        onVolverAlSalon={() => setVistaActual('SALON')}
        onGuardarComanda={handleGuardarComanda}
      />
    );
  }

  return (
    <div className="mesas-page-container">
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER DE MONITOR */}
      <div className="mesas-header-banner">
        <div className="banner-title-box">
          <h2 className="banner-main-title">Distribución de Comensales</h2>
          <p className="banner-sub-text">Monitoreo e inteligencia de atención en tiempo real</p>
        </div>

        <div className="mesas-legend-bar">
          <span className="legend-badge libre">● Libre</span>
          <span className="legend-badge en-cocina">🔥 En Cocina</span>
          <span className="legend-badge para-recoger">🔔 Para Recoger</span>
          <span className="legend-badge listo-pagar">👤 Listo para Pagar</span>
          <span className="legend-badge unificada">🔗 Unificada</span>
        </div>
      </div>

      {/* PESTAÑAS VISTA SALÓN */}
      <div className="mesas-navigation-bar">
        <div className="pills-tabs-center">
          <button className={`tab-pill-btn ${activeTab === 'SALON' ? 'active' : ''}`} onClick={() => setActiveTab('SALON')}>
            ⠿ Vista Salón
          </button>
          <button className={`tab-pill-btn ${activeTab === 'UNIFICADAS' ? 'active' : ''}`} onClick={() => setActiveTab('UNIFICADAS')}>
            👥 Mesas Unificadas
          </button>
          <button className={`tab-pill-btn ${activeTab === 'RESERVADAS' ? 'active' : ''}`} onClick={() => setActiveTab('RESERVADAS')}>
            ☑ Mesas Reservadas
          </button>
        </div>
      </div>

      {/* GRILLA DE MESAS */}
      <div className="mesas-grid-card-wrapper">
        <div className="mesas-grid-top-row">
          <div className="mesas-grid-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
            </svg>
            <h3>Mesas del salón</h3>
          </div>

          <button
            className="btn-asignar-reservas"
            onClick={() => setToast({ type: 'info', title: 'Bloque de Reservas', message: 'Seleccione las mesas a reservar.' })}
          >
            🏷 Asignar Bloque de Reservas
          </button>
        </div>

        <div className="mesas-layout-grid">
          {mesas.map(mesa => (
            <MesaCard
              key={mesa.id}
              numero={mesa.numero}
              estado={mesa.estado}
              comensales={mesa.comensales}
              monto={mesa.comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0)}
              onClick={() => handleMesaClick(mesa)}
            />
          ))}
        </div>
      </div>

      {/* MODAL 1: GESTIÓN OPERATIVA */}
      <MesaGestionModal
        isOpen={showGestionModal}
        onClose={() => setShowGestionModal(false)}
        selectedMesa={selectedMesa}
        onAbrirPago={handleAbrirPagoDesdeGestion}
        onAbrirComandera={handleAbrirComanderaDesdeGestion}
        setToast={setToast}
        mesas={mesas}
        setMesas={setMesas}
      />

      {/* MODAL 2: DIVISIÓN DE PAGO Y CAJA */}
      <MesaPagoModal
        isOpen={showPagoModal}
        onClose={() => setShowPagoModal(false)}
        selectedMesa={selectedMesa}
        onConfirmPago={handleConfirmarPagoMesa}
        setToast={setToast}
      />
    </div>
  );
};

export default MesasPage;