import React, { useState, useEffect } from 'react';
import MesaCard from '../../components/common/MesaCard';
import Toast from '../../components/common/Toast';
import MesaGestionModal from './components/MesaGestionModal';
import MesaPagoModal from './components/MesaPagoModal';
import ComanderaPage from './ComanderaPage';
import mesaService from '../../services/mesaService';
import './MesasPage.css';

export const MesasPage = () => {
  const [toast, setToast] = useState(null);
  const [vistaActual, setVistaActual] = useState('SALON'); // 'SALON' | 'COMANDERA'
  const [pisoActivo, setPisoActivo] = useState('PISO_1'); // 'PISO_1' | 'PISO_2' | 'TODOS'
  const [loading, setLoading] = useState(false);

  // Modales
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);

  // Lista Dinámica de Mesas del Backend
  const [mesas, setMesas] = useState([]);

  // Cargar estado inicial del plano de salón desde Spring Boot
  useEffect(() => {
    cargarPlanoSalon();
  }, []);

  const cargarPlanoSalon = async () => {
    try {
      setLoading(true);
      const data = await mesaService.obtenerPlanoSalon();
      
      const mesasBackend = data.mesas || data || [];
      const comandasBackend = data.comandas || data.pedidos || [];

      const mesasFormateadas = mesasBackend
        .filter(m => m != null) 
        .map(m => {
          const numMesa = parseInt(m.numero ?? m.id ?? 0, 10);

          // Asignación de Piso según el número de mesa (1-4 -> Piso 1 | 5-13 -> Piso 2)
          const pisoMesa = numMesa <= 4 ? 'PISO_1' : 'PISO_2';

          const comandaActiva = Array.isArray(comandasBackend)
            ? comandasBackend.find(c => c && (c.numeroMesa === m.numero || c.numeroMesa === m.id))
            : null;
          
          const listaDetalles = comandaActiva?.detalles || comandaActiva?.listaDetalles || [];
          const comandaFormateada = listaDetalles
            .filter(d => !d.pagado)
            .map(d => {
              let estadoTexto = 'Pendiente';
              if (d.canceladoPorCliente) estadoTexto = 'Cancelado';
              else if (d.pagado) estadoTexto = 'Pagado';

              return {
                id: d.id,
                cant: d.cantidad || 1,
                nombre: d.producto?.nombre || d.nombreProducto || 'Plato',
                precio: parseFloat(d.precioUnitario || d.precio || 0),
                pagado: d.pagado || false,
                estado: estadoTexto
              };
            });

          return {
            id: m.id,
            numero: String(m.numero ?? m.id ?? 'S/N'),
            numInt: numMesa,
            piso: pisoMesa,
            estado: m.estado || (comandaFormateada.length > 0 ? 'OCUPADA' : 'LIBRE'),
            comensales: m.comensales || m.capacidad || 0,
            comandaId: comandaActiva ? comandaActiva.id : null,
            comanda: comandaFormateada
          };
        });

      setMesas(mesasFormateadas);
    } catch (error) {
      console.error("Error al cargar plano de salón:", error);
      setToast({
        type: 'error',
        title: 'Error de Red',
        message: 'No se pudo obtener la distribución de mesas desde el servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = (mesa) => {
    setSelectedMesa(mesa);
    setShowGestionModal(true);
  };

  const handleAbrirPagoDesdeGestion = () => {
    if (!selectedMesa || !selectedMesa.comanda || selectedMesa.comanda.length === 0) {
      setToast({ type: 'error', title: 'Mesa Vacía', message: 'No hay consumos registrados para cobrar.' });
      return;
    }
    setShowGestionModal(false);
    setShowPagoModal(true);
  };

  const handleAbrirComanderaDesdeGestion = () => {
    setShowGestionModal(false);
    setVistaActual('COMANDERA');
  };

  const handleGuardarComanda = async (numeroMesa) => {
    await cargarPlanoSalon();
    setVistaActual('SALON');
    setToast({
      type: 'info',
      title: '¡Orden Enviada!',
      message: `La comanda de la Mesa #${numeroMesa} fue creada con éxito.`
    });
  };

  const handleConfirmarPagoMesa = async (datosPago) => {
    try {
      if (selectedMesa && selectedMesa.comandaId) {
        const idsDetalles = selectedMesa.selectedItemsPay && selectedMesa.selectedItemsPay.length > 0
          ? selectedMesa.selectedItemsPay
          : selectedMesa.comanda.map(item => item.id);

        await mesaService.procesarCobro(
          selectedMesa.comandaId,
          selectedMesa.id,
          idsDetalles,
          datosPago.tickets
        );
      }

      await cargarPlanoSalon();

      setToast({
        type: 'info',
        title: '¡Cobro Procesado!',
        message: `Se registraron las ventas para la Mesa #${selectedMesa?.numero} correctamente.`
      });
    } catch (error) {
      console.error("Error al procesar el cobro:", error);
      setToast({
        type: 'error',
        title: 'Error de Cobro',
        message: 'Ocurrió un inconveniente al registrar el pago multiticket.'
      });
    } finally {
      setShowPagoModal(false);
    }
  };

  // Filtrar mesas según el piso seleccionado
  const mesasPiso1 = mesas.filter(m => m.numInt <= 4);
  const mesasPiso2 = mesas.filter(m => m.numInt >= 5 && m.numInt <= 13);

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

      {/* HEADER PRINCIPAL */}
      <div className="mesas-header-banner">
        <div className="banner-title-box">
          <h2 className="banner-main-title">Distribución del Salón (13 Mesas)</h2>
          <p className="banner-sub-text">SRA MILLONES — Control de Nivel por Pisos</p>
        </div>

        <div className="mesas-legend-bar">
          <span className="legend-badge libre">● Libre (Verde)</span>
          <span className="legend-badge ocupada">🔴 Ocupado (Rojo)</span>
        </div>
      </div>

      {/* FILTRO DE NAVEGACIÓN POR PISOS */}
      <div className="mesas-navigation-bar">
        <div className="pills-tabs-center">
          <button 
            className={`tab-pill-btn ${pisoActivo === 'PISO_1' ? 'active' : ''}`} 
            onClick={() => setPisoActivo('PISO_1')}
          >
            🏢 Primer Piso (Mesas 1 - 4)
          </button>
          <button 
            className={`tab-pill-btn ${pisoActivo === 'PISO_2' ? 'active' : ''}`} 
            onClick={() => setPisoActivo('PISO_2')}
          >
            🏢 Segundo Piso (Mesas 5 - 13)
          </button>
          <button 
            className={`tab-pill-btn ${pisoActivo === 'TODOS' ? 'active' : ''}`} 
            onClick={() => setPisoActivo('TODOS')}
          >
            ⠿ Ver Salón Completo (13 Mesas)
          </button>
        </div>
      </div>

      {/* VISTA DE PISO 1 */}
      {(pisoActivo === 'PISO_1' || pisoActivo === 'TODOS') && (
        <div className="mesas-grid-card-wrapper">
          <div className="mesas-grid-top-row">
            <div className="mesas-grid-title">
              <h3>📍 PRIMER PISO — 4 Mesas</h3>
            </div>
          </div>

          <div className="mesas-layout-grid">
            {loading ? (
              <div className="empty-mesas-msg">Cargando Primer Piso...</div>
            ) : mesasPiso1.length === 0 ? (
              <div className="empty-mesas-msg">Sin mesas registradas para el Primer Piso.</div>
            ) : (
              mesasPiso1.map(mesa => (
                <div key={mesa.id} className="mesa-card-relative-wrapper">
                  {/* ETIQUETA EN LA ESQUINA */}
                  <span className={`badge-corner-status ${mesa.estado === 'OCUPADA' ? 'ocupado' : 'libre'}`}>
                    {mesa.estado === 'OCUPADA' ? 'Ocupado' : 'Libre'}
                  </span>
                  
                  <MesaCard
                    numero={mesa.numero}
                    estado={mesa.estado}
                    comensales={mesa.comensales}
                    monto={Array.isArray(mesa.comanda) ? mesa.comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0) : 0}
                    onClick={() => handleMesaClick(mesa)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VISTA DE PISO 2 */}
      {(pisoActivo === 'PISO_2' || pisoActivo === 'TODOS') && (
        <div className="mesas-grid-card-wrapper" style={{ marginTop: '1.5rem' }}>
          <div className="mesas-grid-top-row">
            <div className="mesas-grid-title">
              <h3>📍 SEGUNDO PISO — 9 Mesas</h3>
            </div>
          </div>

          <div className="mesas-layout-grid">
            {loading ? (
              <div className="empty-mesas-msg">Cargando Segundo Piso...</div>
            ) : mesasPiso2.length === 0 ? (
              <div className="empty-mesas-msg">Sin mesas registradas para el Segundo Piso.</div>
            ) : (
              mesasPiso2.map(mesa => (
                <div key={mesa.id} className="mesa-card-relative-wrapper">
                  {/* ETIQUETA EN LA ESQUINA */}
                  <span className={`badge-corner-status ${mesa.estado === 'OCUPADA' ? 'ocupado' : 'libre'}`}>
                    {mesa.estado === 'OCUPADA' ? 'Ocupado' : 'Libre'}
                  </span>

                  <MesaCard
                    numero={mesa.numero}
                    estado={mesa.estado}
                    comensales={mesa.comensales}
                    monto={Array.isArray(mesa.comanda) ? mesa.comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0) : 0}
                    onClick={() => handleMesaClick(mesa)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODALES DE ATENCIÓN */}
      <MesaGestionModal
        isOpen={showGestionModal}
        onClose={() => setShowGestionModal(false)}
        selectedMesa={selectedMesa}
        onAbrirPago={handleAbrirPagoDesdeGestion}
        onAbrirComandera={handleAbrirComanderaDesdeGestion}
        setToast={setToast}
        mesas={mesas}
        setMesas={setMesas}
        onActualizarSalon={cargarPlanoSalon}
      />

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