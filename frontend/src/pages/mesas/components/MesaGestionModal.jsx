import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import { PlusIcon } from '../../../components/common/Icons';
import SeleccionarMesaModal from './SeleccionarMesaModal';
import './MesaGestionModal.css';

export const MesaGestionModal = ({ isOpen, onClose, selectedMesa, onAbrirPago, onAbrirComandera, setToast, mesas = [], setMesas }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Estado para el Modal Selector de Mesa
  const [selectorConfig, setSelectorConfig] = useState({
    isOpen: false,
    titulo: '',
    descripcion: '',
    soloLibres: true,
    tipoAccion: '' // 'CAMBIAR', 'DIVIDIR', 'AGRUPAR', 'RESERVAS'
  });

  if (!selectedMesa) return null;

  const subtotalGeneral = selectedMesa.comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0);
  const subtotalElegido = selectedMesa.comanda
    .filter(item => selectedItems.includes(item.id))
    .reduce((acc, item) => acc + (item.cant * item.precio), 0);

  const handleToggleItemSelect = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleToggleSelectAllItems = () => {
    if (selectedItems.length === selectedMesa.comanda.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectedMesa.comanda.map(i => i.id));
    }
  };

  const handleAbrirSelector = (tipoAccion) => {
  switch (tipoAccion) {
    case 'CAMBIAR':
      setSelectorConfig({
        isOpen: true,
        titulo: 'Cambiar de Mesa',
        descripcion: 'Seleccione la mesa destino. Si está ocupada, ambas comandas se unificarán.',
        soloLibres: false, // 👈 Ahora muestra también mesas ocupadas
        tipoAccion: 'CAMBIAR'
      });
      break;

    case 'DIVIDIR':
      if (selectedItems.length === 0) {
        setToast({ 
          type: 'error', 
          title: 'Selección requerida', 
          message: 'Seleccione al menos un ítem con el checkbox para dividir.' 
        });
        return;
      }
      setSelectorConfig({
        isOpen: true,
        titulo: 'Dividir Comanda',
        descripcion: 'Seleccione la mesa destino a la que enviará los ítems. Si está ocupada, se sumarán a su comanda.',
        soloLibres: false, // 👈 Ahora muestra también mesas ocupadas
        tipoAccion: 'DIVIDIR'
      });
      break;

    case 'AGRUPAR':
      setSelectorConfig({
        isOpen: true,
        titulo: 'Agrupar Mesas',
        descripcion: 'Seleccione la mesa activa con la cual unificará la atención.',
        soloLibres: false,
        tipoAccion: 'AGRUPAR'
      });
      break;

    case 'RESERVAS':
      setSelectorConfig({
        isOpen: true,
        titulo: 'Mudar a Reservas',
        descripcion: 'Seleccione la mesa reservada para vincular este consumo.',
        soloLibres: true,
        tipoAccion: 'RESERVAS'
      });
      break;

    default:
      break;
  }
};

  const handleConfirmarTrasladoMesa = (mesaDestino) => {
  setSelectorConfig(prev => ({ ...prev, isOpen: false }));

  if (selectorConfig.tipoAccion === 'CAMBIAR') {
    setMesas(prev => prev.map(m => {
      // Liberar la mesa de origen
      if (m.id === selectedMesa.id) {
        return { ...m, estado: 'LIBRE', comanda: [] };
      }
      // Trasladar o Fusionar en la mesa de destino
      if (m.id === mesaDestino.id) {
        const esDestinoOcupada = m.estado !== 'LIBRE';
        return {
          ...m,
          estado: esDestinoOcupada ? m.estado : selectedMesa.estado,
          comanda: [...m.comanda, ...selectedMesa.comanda] // Fusiona si ya tenía ítems
        };
      }
      return m;
    }));

    setToast({
      type: 'info',
      title: 'Mesa Trasladada',
      message: `Comanda trasladada de Mesa #${selectedMesa.numero} a Mesa #${mesaDestino.numero}.`
    });
    onClose();

  } else if (selectorConfig.tipoAccion === 'DIVIDIR') {
    const itemsAMover = selectedMesa.comanda.filter(i => selectedItems.includes(i.id));
    const itemsQuedan = selectedMesa.comanda.filter(i => !selectedItems.includes(i.id));

    setMesas(prev => prev.map(m => {
      // Actualizar origen (quitar seleccionados o liberar si quedó vacía)
      if (m.id === selectedMesa.id) {
        return {
          ...m,
          estado: itemsQuedan.length === 0 ? 'LIBRE' : m.estado,
          comanda: itemsQuedan
        };
      }
      // Agregar los ítems divididos a la mesa destino (sea libre u ocupada)
      if (m.id === mesaDestino.id) {
        const nuevoEstado = m.estado === 'LIBRE' ? 'EN_COCINA' : m.estado;
        return {
          ...m,
          estado: nuevoEstado,
          comanda: [...m.comanda, ...itemsAMover]
        };
      }
      return m;
    }));

    setToast({
      type: 'info',
      title: 'Comanda Dividida',
      message: `Ítems seleccionados transferidos a Mesa #${mesaDestino.numero}.`
    });
    setSelectedItems([]);
    onClose();
  }
};

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Gestión Operativa — Mesa # ${selectedMesa.numero}`}
        maxWidth="820px"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        }
      >
        <div className="gestion-split-layout">
          {/* ACCIONES DISPONIBLES */}
          <div className="gestion-col-acciones">
            <span className="gestion-section-label">ACCIONES DISPONIBLES</span>

            <button 
  className="btn-gestion-action green" 
  onClick={onAbrirComandera} // 👈 2. Llamar a la función de apertura
>
  <PlusIcon width={16} height={16} /> AÑADIR PRODUCTO
</button>

            <button className="btn-gestion-action beige" onClick={() => handleAbrirSelector('CAMBIAR')}>
              ⇆ CAMBIAR DE MESA
            </button>

            <button className="btn-gestion-action blue" onClick={() => handleAbrirSelector('DIVIDIR')}>
              ⑂ DIVIDIR COMANDA
            </button>

            <button className="btn-gestion-action purple" onClick={() => handleAbrirSelector('AGRUPAR')}>
              🔗 AGRUPAR MESAS
            </button>

            <button className="btn-gestion-action dark" onClick={handleToggleSelectAllItems}>
              ✔ {selectedItems.length === selectedMesa.comanda.length ? 'DESMARCAR TODO' : 'SELECCIONAR TODO'}
            </button>

            <button className="btn-gestion-action dark-secondary" onClick={() => handleAbrirSelector('RESERVAS')}>
              📅 MUDAR A RESERVAS
            </button>

            <button className="btn-gestion-action confirm-pago" onClick={onAbrirPago}>
              💳 CONFIRMAR PAGO
            </button>
          </div>

          {/* DETALLE COMANDA */}
          <div className="gestion-col-comanda">
            <span className="gestion-section-label">📋 DETALLE DE COMANDA ACTIVA</span>

            <div className="comanda-items-scroll-box">
              {selectedMesa.comanda.length === 0 ? (
                <div className="comanda-empty-state">
                  <p>La mesa no tiene consumos registrados.</p>
                </div>
              ) : (
                selectedMesa.comanda.map(item => {
                  const isChecked = selectedItems.includes(item.id);
                  return (
                    <div key={item.id} className={`comanda-item-card ${isChecked ? 'selected' : ''}`}>
                      <div className="comanda-item-left">
                        <span className="item-cant-badge">{item.cant}x</span>
                        <span className="item-nombre">{item.nombre}</span>
                      </div>

                      <div className="comanda-item-right">
                        <span className="item-precio">S/ {(item.cant * item.precio).toFixed(2)}</span>
                        <span className="item-estado-pill">{item.estado}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItemSelect(item.id)}
                          className="checkbox-senior-item"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="comanda-totales-banner">
              <div className="subtotal-row general">
                <span>SUBTOTAL GENERAL:</span>
                <strong className="monto-general">S/ {subtotalGeneral.toFixed(2)}</strong>
              </div>

              <div className="subtotal-row elegido">
                <div className="elegido-label-box">
                  <span className="check-icon-green">✔</span>
                  <span>SUBTOTAL ELEGIDO:</span>
                </div>
                <strong className="monto-elegido">S/ {subtotalElegido.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL COMPONENTE SELECTOR DE MESAS (BOCETO PAINT) */}
      <SeleccionarMesaModal
        isOpen={selectorConfig.isOpen}
        onClose={() => setSelectorConfig(prev => ({ ...prev, isOpen: false }))}
        tituloAccion={selectorConfig.titulo}
        descripcionAccion={selectorConfig.descripcion}
        mesas={mesas}
        mesaOrigen={selectedMesa}
        soloMesasLibres={selectorConfig.soloLibres}
        onConfirmar={handleConfirmarTrasladoMesa}
      />
    </>
  );
};

export default MesaGestionModal;