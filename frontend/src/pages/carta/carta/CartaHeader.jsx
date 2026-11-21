import React from 'react';
import { UtensilsIcon } from '../../../components/common/Icons';
import './CartaHeader.css';

// Encabezado principal (hero) de la carta
const CartaHeader = () => (
  <header className="carta-header">
    <div className="carta-header-content">
      <span className="carta-badge">
        <UtensilsIcon width={14} height={14} />
        Gastronomía Peruana
      </span>
      <h1 className="carta-title">Sra. Millones</h1>
      <p className="carta-subtitle">Restaurante Criollo • Carta Digital</p>
    </div>
  </header>
);

export default CartaHeader;
