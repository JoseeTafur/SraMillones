import React from 'react';
import { CartIcon } from '../../../components/common/Icons';
import './CarritoFlotante.css';

// Botón flotante que resume el pedido y abre el panel del carrito
const CarritoFlotante = ({ cantidad, total, onAbrir }) => (
  <div className="carrito-flotante-container">
    <button
      type="button"
      onClick={onAbrir}
      className="btn-flotante-carrito"
      aria-label={`Ver mi pedido, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}
    >
      <span className="carrito-flotante-icono">
        <CartIcon width={22} height={22} />
        <span className="carrito-badge-count" key={cantidad}>{cantidad}</span>
      </span>
      <span className="carrito-flotante-texto">
        <span className="carrito-flotante-label">Ver mi pedido</span>
        <span className="carrito-flotante-total">S/ {total.toFixed(2)}</span>
      </span>
    </button>
  </div>
);

export default CarritoFlotante;
