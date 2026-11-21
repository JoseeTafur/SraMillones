import React, { useEffect, useRef } from 'react';
import { SearchIcon, ClearIcon } from '../../../components/common/Icons';
import { prefiereMenosMovimiento } from './utils';
import './CartaNav.css';

// Barra sticky: buscador de platos + chips de categorías
const CartaNav = ({ busqueda, onBusqueda, categorias, activa, onIrASeccion }) => {
  const chipsRef = useRef(null);

  // Mantiene el chip activo centrado dentro de la barra
  useEffect(() => {
    const contenedor = chipsRef.current;
    if (!contenedor) return;
    const chip = contenedor.querySelector('.carta-chip.is-active');
    if (!chip) return;

    contenedor.scrollTo({
      left: chip.offsetLeft - (contenedor.clientWidth - chip.clientWidth) / 2,
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
    });
  }, [activa]);

  return (
    <div className="carta-nav">
      <div className="carta-search">
        <span className="carta-search-icon"><SearchIcon width={17} height={17} /></span>
        <input
          type="text"
          inputMode="search"
          className="carta-search-input"
          placeholder="Buscar un plato..."
          aria-label="Buscar un plato"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            type="button"
            className="carta-search-clear"
            onClick={() => onBusqueda('')}
            aria-label="Limpiar búsqueda"
          >
            <ClearIcon width={14} height={14} />
          </button>
        )}
      </div>

      {categorias.length > 0 && (
        <nav className="carta-chips" ref={chipsRef} aria-label="Categorías de la carta">
          {categorias.map((categoria, i) => (
            <button
              key={categoria}
              type="button"
              className={`carta-chip ${categoria === activa ? 'is-active' : ''}`}
              onClick={() => onIrASeccion(i)}
              aria-current={categoria === activa ? 'true' : undefined}
            >
              {categoria}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default CartaNav;
