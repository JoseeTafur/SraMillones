import React, { useState } from 'react';
import PagoPaso from './PagoPaso';
import MetodoPagoSelector from './MetodoPagoSelector';
import { obtenerMetodo } from './metodosPago';
import './PagoMetodos.css';

// QR del método elegido. Se remonta con `key` al cambiar de método,
// así reinicia su estado de error y repite la animación de entrada.
const QrMetodo = ({ metodo }) => {
  const [error, setError] = useState(false);

  return (
    <div className="metodo-qr-frame">
      {error ? (
        <div className="metodo-qr-error">
          QR de {metodo.nombre} no disponible por ahora.
        </div>
      ) : (
        <img
          src={metodo.qr}
          alt={`QR para pagar con ${metodo.nombre}`}
          className="metodo-qr"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

// Paso 1 del pago: elegir método (Yape / Plin) y escanear su QR
const PagoMetodos = ({ metodos, metodoId, onCambiar, total }) => {
  const metodo = obtenerMetodo(metodoId);

  return (
    <PagoPaso
      numero="1"
      titulo={`Paga con ${metodo.nombre}`}
      descripcion={
        <>
          Escanea el QR y {metodo.verbo} exactamente <strong>S/ {total.toFixed(2)}</strong>
        </>
      }
      variante="pago-paso--metodo"
      estilo={{
        '--metodo-color': metodo.color,
        '--metodo-fondo': metodo.fondo,
        '--metodo-borde': metodo.borde,
      }}
    >
      <MetodoPagoSelector metodos={metodos} metodoId={metodo.id} onCambiar={onCambiar} />
      <QrMetodo key={metodo.id} metodo={metodo} />
    </PagoPaso>
  );
};

export default PagoMetodos;
