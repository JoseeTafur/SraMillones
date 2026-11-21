import { useEffect, useRef, useState } from 'react';
import { prefiereMenosMovimiento } from '../utils';

// Estado y lógica del carrito de compras.
// Incluye dos estados puramente visuales:
//  - agregadoId: producto recién agregado (para el feedback "Agregado")
//  - saliendoId: producto que se está quitando (para la animación de salida)
const useCarrito = () => {
  const [carrito, setCarrito] = useState([]);
  const [agregadoId, setAgregadoId] = useState(null);
  const [saliendoId, setSaliendoId] = useState(null);

  const agregadoTimer = useRef(null);
  const salidaTimer = useRef(null);

  useEffect(() => () => {
    clearTimeout(agregadoTimer.current);
    clearTimeout(salidaTimer.current);
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

    // Feedback visual en el botón de la tarjeta
    setAgregadoId(producto.id);
    clearTimeout(agregadoTimer.current);
    agregadoTimer.current = setTimeout(() => setAgregadoId(null), 1200);
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

  // Igual que cambiarCantidad, pero deja correr la animación de salida
  // antes de quitar el producto del carrito.
  const cambiarCantidadAnimado = (item, delta) => {
    if (saliendoId === item.id) return;

    if (item.cantidad + delta <= 0) {
      setSaliendoId(item.id);
      salidaTimer.current = setTimeout(() => {
        cambiarCantidad(item.id, delta);
        setSaliendoId(null);
      }, prefiereMenosMovimiento() ? 0 : 240);
    } else {
      cambiarCantidad(item.id, delta);
    }
  };

  const total = Number(
    carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2)
  );

  const cantidadTotalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return {
    carrito,
    total,
    cantidadTotalItems,
    agregadoId,
    saliendoId,
    agregarAlCarrito,
    cambiarCantidadAnimado,
  };
};

export default useCarrito;
