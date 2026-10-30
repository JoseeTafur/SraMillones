import React, { useEffect, useState } from 'react';
import productoService from '../../services/productoService';
import './CartaPublicaPage.css';

const CartaPublicaPage = () => {
  const [catalogo, setCatalogo] = useState({ categorias: [], productos: [] });
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  // 📱 Reemplaza con el WhatsApp real del restaurante (ej: 51 para Perú)
  const TELEFONO_WHATSAPP = "51987654321"; 

  useEffect(() => {
    productoService.obtenerCartaPublica()
      .then(data => {
        setCatalogo(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al cargar la carta:", err);
        setCargando(false);
      });
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(item => item.id === producto.id);
      if (existe) {
        return prevCarrito.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad: 1 }];
    });
    setCarritoAbierto(true);
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prevCarrito => {
      return prevCarrito.map(item => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + delta;
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0).toFixed(2);
  };

  const enviarPedidoWhatsApp = () => {
    if (carrito.length === 0) return;

    let mensaje = "¡Hola, Sra. Millones! 🍽️ Deseo realizar el siguiente pedido:\n\n";
    carrito.forEach((item, index) => {
      mensaje += `${index + 1}. *${item.nombre}* (x${item.cantidad}) - S/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
    });
    mensaje += `\n💰 *TOTAL A PAGAR: S/ ${calcularTotal()}*\n\n¿Me confirman disponibilidad y el costo de delivery por favor?`;

    const urlWhatsApp = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
  };

  const productosPorCategoria = catalogo.productos ? catalogo.productos.reduce((acc, producto) => {
    const nombreCategoria = producto.categoria?.nombre || 'General';
    if (!acc[nombreCategoria]) {
      acc[nombreCategoria] = [];
    }
    acc[nombreCategoria].push(producto);
    return acc;
  }, {}) : {};

  if (cargando) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <h2 style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Cargando la experiencia Sra. Millones...</h2>
      </div>
    );
  }

  const cantidadTotalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="carta-container">
      
      {/* 🌟 HERO HEADER */}
      <header className="carta-header">
        <div className="carta-header-content">
          <span className="carta-badge">Gastronomía Peruana</span>
          <h1 className="carta-title">Sra. Millones</h1>
          <p className="carta-subtitle">Restaurante Criollo • Carta Digital</p>
        </div>
      </header>

      {/* 📋 CONTENIDO DE LA CARTA */}
      <main className="carta-main">
        {Object.keys(productosPorCategoria).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>No hay platos disponibles en este momento.</p>
          </div>
        ) : (
          Object.entries(productosPorCategoria).map(([categoria, productos]) => (
            <section key={categoria} className="carta-section">
              <div className="carta-category-title-wrapper">
                <span className="carta-category-icon">
                  {categoria.includes('CALIENTE') ? '🔥' : '🥗'}
                </span>
                <h2 className="carta-category-name">{categoria}</h2>
              </div>
              
              <div className="carta-grid">
                {productos.map(producto => (
                  <div key={producto.id} className="producto-card">
                    <div className="producto-img-container">
                      {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} className="producto-img" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="producto-img-placeholder">Sin imagen</div>
                      )}
                    </div>

                    <div className="producto-info">
                      <h3 className="producto-nombre">{producto.nombre}</h3>

                      <div>
                        <div className="producto-footer">
                          <div>
                            <span className="producto-precio-label">Precio</span>
                            <span className="producto-precio-valor">S/ {Number(producto.precio).toFixed(2)}</span>
                          </div>
                          <span className="producto-badge-disponible">Disponible</span>
                        </div>

                        <button onClick={() => agregarAlCarrito(producto)} className="btn-agregar">
                          🛒 Agregar al Pedido
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* 🛒 BOTÓN FLOTANTE DEL CARRITO */}
      {cantidadTotalItems > 0 && (
        <div className="carrito-flotante-container">
          <button onClick={() => setCarritoAbierto(!carritoAbierto)} className="btn-flotante-carrito">
            <span>🛒 Ver Mi Pedido</span>
            <span className="carrito-badge-count">{cantidadTotalItems}</span>
          </button>
        </div>
      )}

      {/* 🛍️ MODAL / PANEL LATERAL DEL CARRITO */}
      {carritoAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div className="modal-header">
              <h2 className="modal-title">Tu Pedido</h2>
              <button onClick={() => setCarritoAbierto(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              {carrito.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '3rem' }}>Tu carrito está vacío.</p>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="carrito-item">
                    <div>
                      <h4 className="carrito-item-nombre">{item.nombre}</h4>
                      <span className="carrito-item-precio">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                    <div className="carrito-controls">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="carrito-ctrl-btn">-</button>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, 1)} className="carrito-ctrl-btn">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="carrito-footer">
                <div className="carrito-total-row">
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4B5563' }}>Total a pagar:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#5C0612' }}>S/ {calcularTotal()}</span>
                </div>

                <button onClick={enviarPedidoWhatsApp} className="btn-enviar-wsp">
                  💬 Enviar Pedido por WhatsApp
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      <footer className="carta-footer">
        <p>© 2026 Sra. Millones • Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default CartaPublicaPage;