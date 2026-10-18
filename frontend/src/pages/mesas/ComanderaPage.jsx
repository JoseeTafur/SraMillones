import React, { useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { SearchIcon, PlusIcon } from '../../components/common/Icons';
import './ComanderaPage.css';

export const ComanderaPage = ({ mesa = { numero: '2' }, onVolverAlSalon, onGuardarComanda }) => {
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODOS');
  const [instrucciones, setInstrucciones] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Carrito de compras con ítems independientes
  const [cart, setCart] = useState([]);

  // Catálogo de productos
  const productosCatalogo = [
    {
      id: 1,
      nombre: 'Lomo Saltado',
      precio: 35.00,
      categoria: 'FONDOS',
      imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      nombre: 'Causa Limeña',
      precio: 20.00,
      categoria: 'ENTRADAS',
      imagen: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      nombre: 'Ají de Gallina',
      precio: 20.00,
      categoria: 'FONDOS',
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 4,
      nombre: 'Ceviche de Pescado',
      precio: 32.00,
      categoria: 'ENTRADAS',
      imagen: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 5,
      nombre: 'Chicha Morada 1L',
      precio: 12.00,
      categoria: 'BEBIDAS',
      imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 6,
      nombre: 'Pisco Sour Clásico',
      precio: 18.00,
      categoria: 'BEBIDAS',
      imagen: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=60'
    }
  ];

  // Agregar producto como ítem independiente
  const handleAgregarProducto = (producto) => {
    const nuevoItemIndependiente = {
      cartItemId: Date.now() + Math.random(),
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cant: 1,
      estado: 'En Cocina'
    };

    setCart(prev => [...prev, nuevoItemIndependiente]);
  };

  // Quitar ítem individual
  const handleEliminarItem = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  // Filtrado de catálogo por búsqueda y categoría
  const productosFiltrados = productosCatalogo.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCat = categoriaActiva === 'TODOS' || p.categoria === categoriaActiva;
    return coincideTexto && coincideCat;
  });

  const totalOrden = cart.reduce((acc, i) => acc + i.precio, 0);

  const handleSolicitarEnviarCocina = () => {
    if (cart.length === 0) {
      setToast({
        type: 'error',
        title: 'Orden Vacía',
        message: 'Agregue al menos un platillo o bebida antes de enviar a cocina.'
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmarEnvioCocina = () => {
    setShowConfirmModal(false);

    if (onGuardarComanda) {
      onGuardarComanda(mesa.numero, cart, instrucciones);
    }

    if (onVolverAlSalon) {
      onVolverAlSalon();
    }
  };

  return (
    <div className="comandera-page-container">
      {/* Toast Flotante */}
      {toast && (
        <div className="toast-floating-container">
          <Toast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* BANNER ENCABEZADO SUPERIOR */}
      <div className="comandera-top-banner">
        <div className="top-banner-left">
          <button className="btn-back-salon" onClick={onVolverAlSalon}>
            ‹ Volver al Salón
          </button>
          <div className="mesa-tag-header">
            <span>MESA Nº</span>
            <h2>{mesa.numero}</h2>
          </div>
        </div>

        <div className="top-banner-right">
          <span className="comandera-title-badge">📋 COMANDERA DE ATENCIÓN</span>
        </div>
      </div>

      <div className="comandera-main-layout">
        {/* COLUMNA IZQUIERDA: BÚSQUEDA, FILTROS Y CATÁLOGO */}
        <div className="comandera-catalogo-section">
          
          {/* FILA DE BÚSQUEDA Y FILTROS USANDO ESTILOS ESTÁNDAR DE LA JAMA */}
          <div className="comandera-filters-row">
            {/* Buscador Estándar */}
            <div className="search-input-box">
  <div className="search-icon-wrapper">
    <SearchIcon width={18} height={18} />
  </div>
  <input
    type="text"
    placeholder="Buscar plato o bebida..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {searchTerm && (
    <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
      ✕
    </button>
  )}
</div>

            {/* Pastillas / Pills de Categoría Estándar */}
            <div className="category-pills-filter">
              {['TODOS', 'ENTRADAS', 'FONDOS', 'BEBIDAS'].map(cat => (
                <button
                  key={cat}
                  className={`btn-filter-pill ${categoriaActiva === cat ? 'active' : ''}`}
                  onClick={() => setCategoriaActiva(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Platillos */}
          <div className="platillos-grid-container">
            {productosFiltrados.map(prod => (
              <div key={prod.id} className="platillo-card-box">
                <div className="platillo-img-wrapper">
                  <img src={prod.imagen} alt={prod.nombre} className="platillo-img" />
                </div>

                <div className="platillo-card-info">
                  <h4 className="platillo-title">{prod.nombre}</h4>
                  
                  <div className="platillo-price-row">
                    <strong className="platillo-precio">S/ {prod.precio.toFixed(2)}</strong>
                    <button
                      className="btn-add-circle"
                      onClick={() => handleAgregarProducto(prod)}
                      title="Agregar ítem"
                    >
                      <PlusIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: DETALLE DE ORDEN POR ÍTEMS INDEPENDIENTES */}
        <div className="comandera-ticket-section">
          <div className="ticket-header-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h3>Detalle de Orden</h3>
            <span className="items-count-badge">{cart.length} ítems</span>
          </div>

          {/* Lista de Ítems */}
          <div className="ticket-items-scroll-list">
            {cart.length === 0 ? (
              <div className="ticket-empty-notice">
                <span>🛒 Ningún producto seleccionado</span>
                <p>Haga clic en el '+' de un plato para agregarlo a la orden.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={item.cartItemId} className="cart-item-row-single">
                  <div className="cart-item-single-left">
                    <span className="single-item-num">#{index + 1}</span>
                    <span className="single-item-name">{item.nombre}</span>
                  </div>

                  <div className="cart-item-single-right">
                    <strong className="single-item-monto">S/ {item.precio.toFixed(2)}</strong>
                    <button
                      className="btn-del-single-item"
                      title="Quitar este plato"
                      onClick={() => handleEliminarItem(item.cartItemId)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Instrucciones para Cocina */}
          <div className="instrucciones-cocina-wrap">
            <label className="label-senior">Instrucciones de cocina...</label>
            <textarea
              className="input-senior textarea-senior"
              rows={2}
              placeholder="Ej. Término medio, sin cebolla, salsa aparte..."
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
            />
          </div>

          {/* Total & Botón Enviar */}
          <div className="ticket-footer-action-box">
            <div className="total-enviar-row">
              <span>Total a enviar:</span>
              <strong className="total-enviar-monto">S/ {totalOrden.toFixed(2)}</strong>
            </div>

            <button
              className="btn-enviar-cocina-lux"
              onClick={handleSolicitarEnviarCocina}
            >
              🔥 ENVIAR A COCINA
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMAR ENVÍO A COCINA */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirmar Envío a Cocina"
        message={`¿Desea enviar los ${cart.length} ítems de la Mesa #${mesa.numero} para su preparación?`}
        confirmText="Sí, Enviar Orden"
        cancelText="Seguir Editando"
        type="warning"
        onConfirm={handleConfirmarEnvioCocina}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default ComanderaPage;