import { useEffect, useState } from 'react';
import { prefiereMenosMovimiento } from '../utils';

// Detecta qué categoría se está viendo al hacer scroll (para resaltar su chip)
// y permite saltar suavemente a una sección.
// Requiere que las secciones tengan id="seccion-{indice}" y data-categoria="{nombre}".
const useScrollSpy = (categorias, cargando) => {
  const [categoriaActiva, setCategoriaActiva] = useState('');

  const claveCategorias = categorias.join('|');
  const activa = categorias.includes(categoriaActiva) ? categoriaActiva : categorias[0];

  useEffect(() => {
    if (cargando || categorias.length === 0 || !('IntersectionObserver' in window)) return undefined;

    const secciones = document.querySelectorAll('.carta-section[data-categoria]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setCategoriaActiva(entry.target.dataset.categoria);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    secciones.forEach(seccion => observer.observe(seccion));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, claveCategorias]);

  const irASeccion = (indice) => {
    const seccion = document.getElementById(`seccion-${indice}`);
    if (!seccion) return;
    setCategoriaActiva(categorias[indice]);
    seccion.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return { activa, irASeccion };
};

export default useScrollSpy;
