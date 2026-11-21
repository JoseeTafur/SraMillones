import React from 'react';
import { SearchIcon, UtensilsIcon } from '../../../components/common/Icons';
import ProductoCard from './ProductoCard';
import './CartaMenu.css';

// Skeletons que se muestran mientras carga la carta
const CartaSkeleton = () => (
  <div role="status" aria-label="Cargando la carta">
    <span className="sr-only">Cargando la experiencia Sra. Millones...</span>
    <div className="carta-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="producto-card producto-card--skeleton is-visible">
          <div className="skeleton-img shimmer" />
          <div className="producto-info">
            <div className="skeleton-line w-70 shimmer" />
            <div className="skeleton-line w-40 shimmer" />
            <div className="skeleton-btn shimmer" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Contenido principal de la carta: secciones por categoría y estados vacíos
const CartaMenu = ({
  cargando,
  totalProductos,
  productosPorCategoria,
  busqueda,
  onLimpiarBusqueda,
  agregadoId,
  onAgregar,
}) => {
  const categorias = Object.keys(productosPorCategoria);

  let contenido;

  if (cargando) {
    contenido = <CartaSkeleton />;
  } else if (totalProductos === 0) {
    contenido = (
      <div className="carta-vacio">
        <span className="carta-vacio-icono"><UtensilsIcon width={30} height={30} /></span>
        <h3>No hay platos disponibles</h3>
        <p>Vuelve en unos minutos, estamos actualizando la carta.</p>
      </div>
    );
  } else if (categorias.length === 0) {
    contenido = (
      <div className="carta-vacio">
        <span className="carta-vacio-icono"><SearchIcon width={30} height={30} /></span>
        <h3>Sin resultados para “{busqueda}”</h3>
        <p>Prueba con otro nombre o revisa la ortografía.</p>
        <button type="button" className="btn-secundario" onClick={onLimpiarBusqueda}>
          Ver toda la carta
        </button>
      </div>
    );
  } else {
    contenido = categorias.map((categoria, i) => {
      const productos = productosPorCategoria[categoria];
      return (
        <section
          key={categoria}
          id={`seccion-${i}`}
          data-categoria={categoria}
          className="carta-section"
        >
          <div className="carta-category-title-wrapper">
            <h2 className="carta-category-name">{categoria}</h2>
            <span className="carta-category-count">
              {productos.length} {productos.length === 1 ? 'plato' : 'platos'}
            </span>
          </div>

          <div className="carta-grid">
            {productos.map((producto, indice) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                indice={indice}
                agregado={agregadoId === producto.id}
                onAgregar={onAgregar}
              />
            ))}
          </div>
        </section>
      );
    });
  }

  return <main className="carta-main">{contenido}</main>;
};

export default CartaMenu;
