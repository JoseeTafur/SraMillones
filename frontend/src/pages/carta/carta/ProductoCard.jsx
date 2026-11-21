import React, { useEffect, useRef, useState } from 'react';
import { PlusIcon, CheckIcon, ImageIcon } from '../../../components/common/Icons';
import './ProductoCard.css';

// Tarjeta de un plato. Maneja su propia animación de entrada (al hacer scroll)
// y el estado de carga de su imagen.
const ProductoCard = ({ producto, indice, agregado, onAgregar }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [imgCargada, setImgCargada] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mostrarImagen = Boolean(producto.imagen) && !imgError;

  return (
    <article
      ref={ref}
      className={`producto-card ${visible ? 'is-visible' : ''}`}
      style={{ '--delay': `${(indice % 4) * 70}ms` }}
    >
      <div className={`producto-img-container ${mostrarImagen && !imgCargada ? 'is-loading' : ''}`}>
        {mostrarImagen ? (
          <img
            ref={(img) => {
              // Imagen que ya estaba en caché: onLoad no siempre se dispara
              if (img && img.complete && img.naturalWidth > 0 && !imgCargada) {
                setImgCargada(true);
              }
            }}
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
            className={`producto-img ${imgCargada ? 'is-loaded' : ''}`}
            onLoad={() => setImgCargada(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="producto-img-placeholder">
            <ImageIcon width={30} height={30} />
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>

        <div>
          <div className="producto-footer">
            <span className="producto-precio-valor">
              <span className="producto-precio-moneda">S/</span>
              {Number(producto.precio).toFixed(2)}
            </span>
            <span className="producto-badge-disponible">Disponible</span>
          </div>

          <button
            type="button"
            onClick={() => onAgregar(producto)}
            className={`btn-agregar ${agregado ? 'is-added' : ''}`}
            aria-live="polite"
          >
            <span className="btn-agregar-icono" key={agregado ? 'ok' : 'add'}>
              {agregado ? <CheckIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
            </span>
            {agregado ? 'Agregado' : 'Agregar al pedido'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductoCard;
