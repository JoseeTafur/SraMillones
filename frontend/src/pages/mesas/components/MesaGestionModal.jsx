import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import {
  PlusIcon,
  CheckIcon,
  TransferIcon,
  SplitIcon,
  CardIcon
} from '../../../components/common/Icons';
import SeleccionarMesaModal from './SeleccionarMesaModal';
import mesaService from '../../../services/mesaService';
import './MesaGestionModal.css';

export const MesaGestionModal = ({
  isOpen,
  onClose,
  selectedMesa,
  onAbrirPago,
  onAbrirComandera,
  setToast,
  mesas = [],
  setMesas,
  onActualizarSalon
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Estado para el ConfirmDialog de eliminación
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    item: null
  });

  const [selectorConfig, setSelectorConfig] = useState({
    isOpen: false,
    titulo: '',
    descripcion: '',
    soloLibres: true,
    tipoAccion: ''
  });

  if (!selectedMesa) return null;

  const comanda = Array.isArray(selectedMesa.comanda) ? selectedMesa.comanda : [];
  const subtotalGeneral = comanda.reduce((acc, i) => acc + (i.cant * i.precio), 0);
  const subtotalElegido = comanda
    .filter(item => selectedItems.includes(item.id))
    .reduce((acc, item) => acc + (item.cant * item.precio), 0);

  const handleToggleItemSelect = (itemId, isPagado) => {
    if (isPagado) return;

    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleToggleSelectAllItems = () => {
    const itemsPendientes = comanda.filter(i => !i.pagado).map(i => i.id);
    
    if (selectedItems.length === itemsPendientes.length && itemsPendientes.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(itemsPendientes);
    }
  };

  // Abrir modal de confirmación
  const handleSolicitarEliminarItem = (item) => {
    setConfirmDelete({
      isOpen: true,
      item
    });
  };

  // Ejecutar eliminación confirmada con animación y reactividad directa
  const handleConfirmarEliminacion = async () => {
    const itemAEliminar = confirmDelete.item;
    setConfirmDelete({ isOpen: false, item: null });

    if (!itemAEliminar) return;

    try {
      setLoadingAccion(true);
      await mesaService.eliminarItemComanda(itemAEliminar.id);

      // 🟢 1. Activar animación de salida en la UI
      setDeletingId(itemAEliminar.id);

      // 🟢 2. Esperar 300ms a que termine la animación visual antes de remover del estado
      setTimeout(async () => {
        if (Array.isArray(selectedMesa.comanda)) {
          selectedMesa.comanda = selectedMesa.comanda.filter(i => i.id !== itemAEliminar.id);
        }

        setSelectedItems(prev => prev.filter(id => id !== itemAEliminar.id));
        setDeletingId(null);

        setToast({
          type: 'info',
          title: 'Ítem Eliminado',
          message: `Se eliminó "${itemAEliminar.nombre}" de la comanda.`
        });

        // 🟢 3. Sincronizar el plano general del salón
        if (onActualizarSalon) {
          await onActualizarSalon();
        }
      }, 300);

    } catch (error) {
      console.error("Error al eliminar ítem:", error);
      setToast({
        type: 'error',
        title: 'Error de Eliminación',
        message: error.response?.data?.message || 'No se pudo eliminar el producto de la comanda.'
      });
      setDeletingId(null);
    } finally {
      setLoadingAccion(false);
    }
  };

  const handleAbrirPagoConSeleccion = () => {
    selectedMesa.selectedItemsPay = selectedItems;
    onAbrirPago();
  };

  const handleAbrirSelector = (tipoAccion) => {
    switch (tipoAccion) {
      case 'CAMBIAR':
        if (comanda.length === 0) {
          setToast({ type: 'error', title: 'Mesa Vacía', message: 'No hay comanda activa para trasladar.' });
          return;
        }
        setSelectorConfig({
          isOpen: true,
          titulo: 'Cambiar de Mesa',
          descripcion: 'Seleccione la mesa destino hacia la que trasladará la comanda completa.',
          soloLibres: false,
          tipoAccion: 'CAMBIAR'
        });
        break;

      case 'DIVIDIR':
        if (selectedItems.length === 0) {
          setToast({ type: 'error', title: 'Selección requerida', message: 'Seleccione al menos un plato.' });
          return;
        }
        setSelectorConfig({
          isOpen: true,
          titulo: 'Dividir Comanda',
          descripcion: 'Seleccione la mesa destino para los platos marcados.',
          soloLibres: false,
          tipoAccion: 'DIVIDIR'
        });
        break;

      default:
        break;
    }
  };

  const handleConfirmarTrasladoMesa = async (mesaDestino) => {
    setSelectorConfig(prev => ({ ...prev, isOpen: false }));
    setLoadingAccion(true);

    try {
      if (selectorConfig.tipoAccion === 'CAMBIAR') {
        await mesaService.cambiarDeMesa(selectedMesa.id, mesaDestino.id);
        setToast({ type: 'info', title: 'Mesa Trasladada', message: `Comanda movida a Mesa #${mesaDestino.numero}.` });
        if (onActualizarSalon) await onActualizarSalon();
        onClose();

      } else if (selectorConfig.tipoAccion === 'DIVIDIR') {
        await mesaService.dividirComanda(
          parseInt(selectedMesa.numero, 10), 
          parseInt(mesaDestino.numero, 10), 
          selectedItems
        );
        setToast({ type: 'info', title: 'Comanda Dividida', message: `Platos trasladados a Mesa #${mesaDestino.numero}.` });
        setSelectedItems([]);
        if (onActualizarSalon) await onActualizarSalon();
        onClose();
      }
    } catch (error) {
      console.error("Error operativo:", error);
      setToast({ type: 'error', title: 'Error', message: 'No se pudo completar la operación.' });
    } finally {
      setLoadingAccion(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Gestión Operativa — Mesa #${selectedMesa.numero}`}
        maxWidth="840px"
      >
        <div className="gestion-senior-layout">
          {/* PANEL IZQUIERDO: BOTONERA DE ACCIONES */}
          <aside className="gestion-sidebar-actions">
            <h3 className="section-title-senior">ACCIONES DISPONIBLES</h3>

            <div className="actions-stack-senior">
              <button 
                className="btn-senior-action btn-add" 
                onClick={onAbrirComandera}
                disabled={loadingAccion}
              >
                <PlusIcon width={18} height={18} />
                <span>AÑADIR PRODUCTO</span>
              </button>

              <button 
                className="btn-senior-action btn-transfer" 
                onClick={() => handleAbrirSelector('CAMBIAR')}
                disabled={loadingAccion || comanda.length === 0}
              >
                <TransferIcon width={18} height={18} />
                <span>CAMBIAR DE MESA</span>
              </button>

              <button 
                className="btn-senior-action btn-split" 
                onClick={() => handleAbrirSelector('DIVIDIR')}
                disabled={loadingAccion || comanda.length === 0}
              >
                <SplitIcon width={18} height={18} />
                <span>DIVIDIR COMANDA</span>
              </button>

              <button 
                className="btn-senior-action btn-select-all" 
                onClick={handleToggleSelectAllItems}
                disabled={loadingAccion || comanda.length === 0}
              >
                <CheckIcon width={18} height={18} />
                <span>{selectedItems.length === comanda.length && comanda.length > 0 ? 'DESMARCAR TODO' : 'SELECCIONAR TODO'}</span>
              </button>

              <button 
                className="btn-senior-action btn-pay" 
                onClick={handleAbrirPagoConSeleccion}
                disabled={
                  loadingAccion || 
                  selectedItems.length === 0 || 
                  comanda.some(i => selectedItems.includes(i.id) && i.pagado)
                }
              >
                <CardIcon width={18} height={18} />
                <span>CONFIRMAR PAGO</span>
              </button>
            </div>
          </aside>

          {/* PANEL DERECHO: DETALLE DE LA COMANDA */}
          <section className="gestion-content-comanda">
            <h3 className="section-title-senior">📋 DETALLE DE COMANDA ACTIVA</h3>

            <div className="comanda-scroll-senior">
              {comanda.length === 0 ? (
                <div className="empty-comanda-senior">
                  <p>La mesa no tiene consumos registrados.</p>
                </div>
              ) : (
                comanda.map(item => {
                  const isChecked = selectedItems.includes(item.id);
                  const isDeleting = deletingId === item.id;

                  return (
                    <div 
                      key={item.id} 
                      className={`comanda-card-senior ${isChecked ? 'selected' : ''} ${isDeleting ? 'item-fade-out' : ''}`}
                    >
                      <div className="item-info-senior">
                        <span className="badge-qty-senior">{item.cant}x</span>
                        <span className="item-name-senior">{item.nombre}</span>
                      </div>

                      <div className="item-meta-senior">
                        <span className="item-price-senior">S/ {(item.cant * item.precio).toFixed(2)}</span>
                        
                        <span className={`badge-pago-senior ${item.pagado ? 'pagado' : 'pendiente'}`}>
                          {item.pagado ? '💳 Pagado' : '🔴 Pendiente'}
                        </span>

                        {/* BOTÓN DE ELIMINAR ANIMADO */}
                        {!item.pagado && (
                          <button
                            type="button"
                            aria-label="Delete item"
                            className="delete-button"
                            onClick={() => handleSolicitarEliminarItem(item)}
                            disabled={loadingAccion}
                            title="Eliminar plato de la comanda"
                          >
                            <svg className="trash-svg" viewBox="0 -10 64 74" xmlns="http://www.w3.org/2000/svg">
                              <g id="trash-can">
                                <rect x="16" y="24" width="32" height="30" rx="3" ry="3" fill="#e74c3c"></rect>
                                <g transformOrigin="12 18" id="lid-group">
                                  <rect x="12" y="12" width="40" height="6" rx="2" ry="2" fill="#c0392b"></rect>
                                  <rect x="26" y="8" width="12" height="4" rx="2" ry="2" fill="#c0392b"></rect>
                                </g>
                              </g>
                            </svg>
                          </button>
                        )}

                        {/* CHECKBOX IOS ROJO */}
                        <label className="ios-checkbox red">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={item.pagado || loadingAccion}
                            onChange={() => handleToggleItemSelect(item.id, item.pagado)}
                          />
                          <div className="checkbox-wrapper">
                            <div className="checkbox-bg"></div>
                            <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                              <path
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeWidth="3"
                                stroke="currentColor"
                                d="M4 12L10 18L20 6"
                                className="check-path"
                              ></path>
                            </svg>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RESUMEN DE TOTALES */}
            <footer className="totals-footer-senior">
              <div className="total-row-senior general">
                <span>SUBTOTAL GENERAL:</span>
                <strong className="amount-general">S/ {subtotalGeneral.toFixed(2)}</strong>
              </div>

              <div className="total-row-senior selected">
                <div className="selected-label-senior">
                  <CheckIcon width={20} height={20} color="#15803d" />
                  <span>SUBTOTAL ELEGIDO:</span>
                </div>
                <strong className="amount-selected">S/ {subtotalElegido.toFixed(2)}</strong>
              </div>
            </footer>
          </section>
        </div>
      </Modal>

      {/* MODAL DE SELECCIÓN DE MESAS PARA TRASLADO / DIVISIÓN */}
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

      {/* CONFIRMDIALOG PARA ELIMINACIÓN DE PRODUCTO */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="¿Eliminar producto de la comanda?"
        message={confirmDelete.item ? `Se retirará "${confirmDelete.item.nombre}" (${confirmDelete.item.cant}x) de la Mesa #${selectedMesa.numero}.` : ''}
        type="warning"
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarEliminacion}
        onCancel={() => setConfirmDelete({ isOpen: false, item: null })}
      />
    </>
  );
};

export default MesaGestionModal;