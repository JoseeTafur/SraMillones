import React, { useEffect, useState } from 'react';
import { ClearIcon, CartIcon, WhatsAppIcon } from '../../../components/common/Icons';
import CarritoItem from './CarritoItem';
import PagoMetodos from './PagoMetodos';
import VoucherUpload from './VoucherUpload';
import { METODOS_PAGO } from './metodosPago';
import './CarritoDrawer.css';

// Panel lateral del pedido. Siempre está montado para poder animar
// la apertura y el cierre con CSS.
const CarritoDrawer = ({
  abierto,
  onCerrar,
  carrito,
  total,
  cantidadTotalItems,
  saliendoId,
  onCambiarCantidad,
  voucher,
  onEnviar,
}) => {
  const [metodoId, setMetodoId] = useState(METODOS_PAGO[0].id);

  // Bloquea el scroll del fondo y cierra con Escape mientras está abierto
  useEffect(() => {
    if (!abierto) return undefined;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPresionarTecla);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', alPresionarTecla);
    };
  }, [abierto, onCerrar]);

  return (
    <div
      className={`modal-overlay ${abierto ? 'is-open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      aria-hidden={!abierto}
    >
      <aside className="modal-content" role="dialog" aria-modal="true" aria-label="Tu pedido">

        <div className="modal-header">
          <div>
            <h2 className="modal-title">Tu pedido</h2>
            {cantidadTotalItems > 0 && (
              <p className="modal-subtitle">
                {cantidadTotalItems} {cantidadTotalItems === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>
          <button type="button" onClick={onCerrar} className="modal-close-btn" aria-label="Cerrar pedido">
            <ClearIcon width={18} height={18} />
          </button>
        </div>

        <div className="modal-body">
          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <span className="carrito-vacio-icono"><CartIcon width={30} height={30} /></span>
              <h3>Tu pedido está vacío</h3>
              <p>Agrega platos de la carta para empezar.</p>
              <button type="button" className="btn-secundario" onClick={onCerrar}>
                Ver la carta
              </button>
            </div>
          ) : (
            <>
              {carrito.map(item => (
                <CarritoItem
                  key={item.id}
                  item={item}
                  saliendo={saliendoId === item.id}
                  onCambiar={onCambiarCantidad}
                />
              ))}

              {/* PASO 1 · ELEGIR MÉTODO Y ESCANEAR QR */}
              <PagoMetodos
                metodos={METODOS_PAGO}
                metodoId={metodoId}
                onCambiar={setMetodoId}
                total={total}
              />

              {/* PASO 2 · SUBIR Y VALIDAR VOUCHER */}
              <VoucherUpload
                inputRef={voucher.inputRef}
                voucherFile={voucher.voucherFile}
                voucherPreview={voucher.voucherPreview}
                analizandoVoucher={voucher.analizandoVoucher}
                errorVoucher={voucher.errorVoucher}
                montoDetectado={voucher.montoDetectado}
                voucherValido={voucher.voucherValido}
                onSubir={(e) => voucher.handleVoucherUpload(e, metodoId)}
                onQuitar={voucher.quitarVoucher}
              />
            </>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="carrito-footer">
            <div className="carrito-total-row">
              <span className="carrito-total-label">Total a pagar</span>
              <span className="carrito-total-valor" key={total}>S/ {total.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={onEnviar}
              disabled={!voucher.voucherValido}
              className="btn-enviar-wsp"
            >
              <WhatsAppIcon width={20} height={20} />
              Enviar pedido por WhatsApp
            </button>

            {!voucher.voucherValido && (
              <p className="carrito-hint">
                Sube un voucher con el monto exacto para habilitar el envío del pedido.
              </p>
            )}
          </div>
        )}

      </aside>
    </div>
  );
};

export default CarritoDrawer;
