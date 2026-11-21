import React from 'react';
import { PlusIcon, MinusIcon, TrashIcon } from '../../../components/common/Icons';
import './CarritoItem.css';

// Una fila del carrito: nombre, precio y controles de cantidad
const CarritoItem = ({ item, saliendo, onCambiar }) => (
  <div className={`carrito-item ${saliendo ? 'is-saliendo' : ''}`}>
    <div className="carrito-item-info">
      <h4 className="carrito-item-nombre">{item.nombre}</h4>
      <span className="carrito-item-precio">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
      {item.cantidad > 1 && (
        <span className="carrito-item-unitario">S/ {Number(item.precio).toFixed(2)} c/u</span>
      )}
    </div>

    <div className="carrito-controls">
      <button
        type="button"
        onClick={() => onCambiar(item, -1)}
        className={`carrito-ctrl-btn ${item.cantidad === 1 ? 'is-danger' : ''}`}
        aria-label={item.cantidad === 1 ? `Quitar ${item.nombre}` : `Disminuir cantidad de ${item.nombre}`}
      >
        {item.cantidad === 1
          ? <TrashIcon width={15} height={15} />
          : <MinusIcon width={15} height={15} />}
      </button>
      <span className="carrito-cantidad" key={item.cantidad}>{item.cantidad}</span>
      <button
        type="button"
        onClick={() => onCambiar(item, 1)}
        className="carrito-ctrl-btn"
        aria-label={`Aumentar cantidad de ${item.nombre}`}
      >
        <PlusIcon width={15} height={15} />
      </button>
    </div>
  </div>
);

export default CarritoItem;
