import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';
import { SearchIcon, PlusIcon } from '../../components/common/Icons';
import meseroService from '../../services/meseroService';
import comandaService from '../../services/comandaService';
import './ComanderaPage.css';

export const ComanderaPage = ({ mesa = { id: 1, numero: '1' }, onVolverAlSalon, onGuardarComanda }) => {
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODOS');
  const [instrucciones, setInstrucciones] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Catálogo de productos desde la API
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productosAgotados, setProductosAgotados] = useState({});
  const [categorias, setCategorias] = useState(['TODOS']);

  // Carrito de compras local
  const [cart, setCart] = useState([]);

  useEffect(() => {
    cargarDatosComandera();
  }, [mesa]);

  const cargarDatosComandera = async () => {
    try {
      setLoading(true);
      const data = await meseroService.obtenerDatosComandera(mesa.id);

      const lista = data.productos || [];
      const agotados = data.productosAgotados || {};

      setProductosCatalogo(lista);
      setProductosAgotados(agotados);

      const catsUnicas = ['TODOS', ...new Set(
        lista
          .map(p => p.categoria?.nombre || p.categoria || 'VARIOS')
          .filter(Boolean)
      )];
      setCategorias(catsUnicas);

    } catch (error) {
      console.error("Error al cargar carta de mesero:", error);
      setToast({
        type: 'error',
        title: 'Error de Red',
        message: 'No se pudo obtener la lista de productos desde el servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProducto = (producto) => {
    if (productosAgotados[producto.id]) {
      setToast({
        type: 'error',
        title: 'Producto Agotado',
        message: `El producto "${producto.nombre}" no cuenta con insumos en cocina.`
      });
      return;
    }

    const nuevoItemIndependiente = {
      cartItemId: Date.now() + Math.random(),
      idProducto: producto.id,
      nombre: producto.nombre,
      precioUnitario: parseFloat(producto.precio || 0),
      cantidad: 1
    };

    setCart(prev => [...prev, nuevoItemIndependiente]);
  };

  const handleEliminarItem = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const productosFiltrados = productosCatalogo.filter(p => {
    const nombreProd = p.nombre || '';
    const catProd = p.categoria?.nombre || p.categoria || 'VARIOS';
    const coincideTexto = nombreProd.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCat = categoriaActiva === 'TODOS' || catProd === categoriaActiva;
    return coincideTexto && coincideCat;
  });

  const totalOrden = cart.reduce((acc, i) => acc + i.precioUnitario, 0);

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

  // 🚀 Enviar la comanda hacia la nueva API desacoplada de Comandas
  const handleConfirmarEnvioCocina = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const comandaPayload = {
        observaciones: instrucciones,
        detalles: cart.map(item => ({
          producto: { id: item.idProducto },
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.precioUnitario * item.cantidad
        }))
      };

      // 1. Guardar en la nueva tabla 'comanda'
      const comandaGuardada = await comandaService.guardarComanda(comandaPayload, parseInt(mesa.numero, 10));

      // 2. Notificar al padre pasando la comanda ya guardada (solo para refrescar la UI en pantalla)
      if (onGuardarComanda) {
        await onGuardarComanda(mesa.numero, comandaGuardada);
      }

      if (onVolverAlSalon) {
        onVolverAlSalon();
      }

    } catch (error) {
      console.error("Error al enviar comanda a cocina:", error);
      const msg = error.response?.data?.message || 'Ocurrió un inconveniente al guardar la comanda.';
      setToast({
        type: 'error',
        title: 'Error de Envío',
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comandera-page-container">
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
        {/* COLUMNA IZQUIERDA: CATÁLOGO DE PRODUCTOS */}
        <div className="comandera-catalogo-section">
          
          <div className="comandera-filters-row">
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

            <div className="category-pills-filter">
              {categorias.map(cat => (
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

          <div className="platillos-grid-container">
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                Cargando carta de productos...
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                No se encontraron productos disponibles.
              </div>
            ) : (
              productosFiltrados.map(prod => {
                const estaAgotado = productosAgotados[prod.id];
                const imagenProd = prod.imagenUrl || prod.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';

                return (
                  <div key={prod.id} className={`platillo-card-box ${estaAgotado ? 'agotado' : ''}`}>
                    <div className="platillo-img-wrapper">
                      <img src={imagenProd} alt={prod.nombre} className="platillo-img" />
                      {estaAgotado && <span className="badge-agotado">AGOTADO</span>}
                    </div>

                    <div className="platillo-card-info">
                      <h4 className="platillo-title">{prod.nombre}</h4>
                      
                      <div className="platillo-price-row">
                        <strong className="platillo-precio">S/ {parseFloat(prod.precio || 0).toFixed(2)}</strong>
                        <button
                          className="btn-add-circle"
                          onClick={() => handleAgregarProducto(prod)}
                          title={estaAgotado ? 'Producto agotado' : 'Agregar ítem'}
                          disabled={estaAgotado}
                        >
                          <PlusIcon width={16} height={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: TICKET DE ORDEN */}
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
                    <strong className="single-item-monto">S/ {item.precioUnitario.toFixed(2)}</strong>
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

          <div className="ticket-footer-action-box">
            <div className="total-enviar-row">
              <span>Total a enviar:</span>
              <strong className="total-enviar-monto">S/ {totalOrden.toFixed(2)}</strong>
            </div>

            <button
              className="btn-enviar-cocina-lux"
              onClick={handleSolicitarEnviarCocina}
              disabled={loading}
            >
              {loading ? 'ENVIANDO...' : '🔥 ENVIAR A COCINA'}
            </button>
          </div>
        </div>
      </div>

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