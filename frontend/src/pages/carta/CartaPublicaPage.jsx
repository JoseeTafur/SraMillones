import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import productoService from '../../services/productoService';

import useCarrito from './carta/hooks/useCarrito';
import useVoucher from './carta/hooks/useVoucher';
import useScrollSpy from './carta/hooks/useScrollSpy';
import { normalizar } from './carta/utils';
import { obtenerMetodo } from './carta/metodosPago';

import CartaHeader from './carta/CartaHeader';
import CartaNav from './carta/CartaNav';
import CartaMenu from './carta/CartaMenu';
import CarritoFlotante from './carta/CarritoFlotante';
import CarritoDrawer from './carta/CarritoDrawer';
import CartaFooter from './carta/CartaFooter';

import './CartaPublicaPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TELEFONO_WHATSAPP = "51973860761";

const CartaPublicaPage = () => {
  const [catalogo, setCatalogo] = useState({ categorias: [], productos: [] });
  const [cargando, setCargando] = useState(true);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  const {
    carrito,
    total,
    cantidadTotalItems,
    agregadoId,
    saliendoId,
    agregarAlCarrito,
    cambiarCantidadAnimado,
  } = useCarrito();

  const voucher = useVoucher(total);

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

  /* ───────── Datos derivados ───────── */
  const totalProductos = catalogo.productos ? catalogo.productos.length : 0;

  const productosPorCategoria = useMemo(() => {
    if (!catalogo.productos) return {};
    const termino = normalizar(busqueda);

    return catalogo.productos
      .filter(producto => producto.estado === 1)
      .filter(producto => !termino || normalizar(producto.nombre).includes(termino))
      .reduce((acc, producto) => {
        const nombreCategoria = producto.categoria?.nombre || 'General';
        if (!acc[nombreCategoria]) {
          acc[nombreCategoria] = [];
        }
        acc[nombreCategoria].push(producto);
        return acc;
      }, {});
  }, [catalogo.productos, busqueda]);

  const categorias = Object.keys(productosPorCategoria);
  const { activa, irASeccion } = useScrollSpy(categorias, cargando);

  /* ───────── Envío del pedido (BD Pendiente + WhatsApp) ───────── */
  const enviarPedidoWhatsApp = async () => {
    if (carrito.length === 0 || !voucher.voucherValido || !voucher.voucherFile || enviandoPedido) {
      return;
    }

    setEnviandoPedido(true);
    const metodo = obtenerMetodo(voucher.metodoUsado);

    try {
      const formData = new FormData();
      formData.append('voucher', voucher.voucherFile);
      formData.append('clienteNombre', 'CLIENTE WEB');
      formData.append('metodoPago', (voucher.metodoUsado || 'YAPE').toUpperCase());
      formData.append('tipoAtencion', 'DELIVERY');
      formData.append(
        'itemsJson',
        JSON.stringify(
          carrito.map(item => ({
            idProducto: item.id,
            cantidad: item.cantidad
          }))
        )
      );

      const { data } = await axios.post(
        `${API_BASE_URL}/api/public/carta/pedido-digital`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const codigoSolicitud = data?.idPagoDigital ? `#${data.idPagoDigital}` : '';

      let mensaje = `¡Hola, Sra. Millones! 🍽️ Deseo realizar el siguiente pedido${codigoSolicitud ? ` *(Solicitud ${codigoSolicitud})*` : ''}:\n\n`;
      carrito.forEach((item, index) => {
        mensaje += `${index + 1}. *${item.nombre}* (x${item.cantidad}) - S/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
      });
      mensaje += `\n💰 *TOTAL A PAGAR: S/ ${Number(total).toFixed(2)}*\n`;
      mensaje += `✅ *Voucher ${metodo.nombre} pre-validado* (Monto: S/ ${voucher.montoDetectado?.toFixed(2)})\n`;
      if (codigoSolicitud) {
        mensaje += `🧾 *Código de validación en caja:* ${codigoSolicitud}\n`;
      }
      mensaje += `\n¿Me confirman disponibilidad y el delivery por favor?`;

      const urlWhatsApp = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWhatsApp, '_blank');

      voucher.quitarVoucher();
      setCarritoAbierto(false);
    } catch (err) {
      console.error('Error al registrar solicitud de pago digital:', err);
      alert(
        err.response?.data?.message ||
          'No se pudo registrar el comprobante en el sistema. Inténtalo nuevamente.'
      );
    } finally {
      setEnviandoPedido(false);
    }
  };

  const cerrarCarrito = useCallback(() => setCarritoAbierto(false), []);

  /* ───────── Render ───────── */
  return (
    <div className="carta-container">
      <CartaHeader />

      {!cargando && totalProductos > 0 && (
        <CartaNav
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          categorias={categorias}
          activa={activa}
          onIrASeccion={irASeccion}
        />
      )}

      <CartaMenu
        cargando={cargando}
        totalProductos={totalProductos}
        productosPorCategoria={productosPorCategoria}
        busqueda={busqueda}
        onLimpiarBusqueda={() => setBusqueda('')}
        agregadoId={agregadoId}
        onAgregar={agregarAlCarrito}
      />

      {cantidadTotalItems > 0 && !carritoAbierto && (
        <CarritoFlotante
          cantidad={cantidadTotalItems}
          total={total}
          onAbrir={() => setCarritoAbierto(true)}
        />
      )}

      <CarritoDrawer
        abierto={carritoAbierto}
        onCerrar={cerrarCarrito}
        carrito={carrito}
        total={total}
        cantidadTotalItems={cantidadTotalItems}
        saliendoId={saliendoId}
        onCambiarCantidad={cambiarCantidadAnimado}
        voucher={voucher}
        onEnviar={enviarPedidoWhatsApp}
        enviando={enviandoPedido}
      />

      <CartaFooter />
    </div>
  );
};

export default CartaPublicaPage;