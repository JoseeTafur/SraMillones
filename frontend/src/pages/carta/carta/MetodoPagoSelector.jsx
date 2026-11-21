import React, { useRef } from 'react';
import './MetodoPagoSelector.css';

// Selector tipo "segmentado" para elegir el método de pago (Yape / Plin / ...).
// Accesible: role radiogroup, navegación con flechas del teclado.
const MetodoPagoSelector = ({ metodos, metodoId, onCambiar }) => {
  const botones = useRef([]);
  const indiceActivo = Math.max(0, metodos.findIndex((m) => m.id === metodoId));

  const alPresionarTecla = (e) => {
    const siguiente = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1
      : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1
      : 0;
    if (!siguiente) return;

    e.preventDefault();
    const destino = (indiceActivo + siguiente + metodos.length) % metodos.length;
    onCambiar(metodos[destino].id);
    botones.current[destino]?.focus();
  };

  return (
    <div
      className="metodo-selector"
      role="radiogroup"
      aria-label="Método de pago"
      onKeyDown={alPresionarTecla}
      style={{ '--n': metodos.length }}
    >
      {/* Pastilla que se desliza hacia la opción elegida */}
      <span
        className="metodo-selector-pastilla"
        style={{ transform: `translateX(${indiceActivo * 100}%)` }}
        aria-hidden="true"
      />

      {metodos.map((metodo, i) => {
        const activo = metodo.id === metodoId;
        return (
          <button
            key={metodo.id}
            ref={(el) => { botones.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            className={`metodo-opcion ${activo ? 'is-active' : ''}`}
            style={{ '--opcion-color': metodo.color }}
            onClick={() => onCambiar(metodo.id)}
          >
            <span className="metodo-opcion-punto" aria-hidden="true">
              {metodo.nombre.charAt(0)}
            </span>
            {metodo.nombre}
          </button>
        );
      })}
    </div>
  );
};

export default MetodoPagoSelector;
