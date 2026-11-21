import React from 'react';
import './PagoPaso.css';

// Contenedor reutilizable de un paso del pago (círculo numerado + título + descripción).
// `estilo` permite inyectar variables CSS (por ejemplo, el color del método de pago).
const PagoPaso = ({ numero, titulo, descripcion, variante = '', estilo, children }) => (
  <section className={`pago-paso ${variante}`} style={estilo}>
    <div className="pago-paso-header">
      <span className="pago-paso-num">{numero}</span>
      <div>
        <h4 className="pago-paso-titulo">{titulo}</h4>
        {descripcion && <p className="pago-paso-desc">{descripcion}</p>}
      </div>
    </div>
    {children}
  </section>
);

export default PagoPaso;
