import React from 'react';
import './MesaCard.css';

export const MesaCard = ({
  numero,
  estado = 'LIBRE', // LIBRE, EN_COCINA, PARA_RECOGER, LISTO_PARA_PAGAR, UNIFICADA
  comensales = 0,
  monto = 0.00,
  onClick
}) => {

  // Configuración de íconos y textos según el estado operativo
  const renderContentByState = () => {
    switch (estado) {
      case 'EN_COCINA':
        return {
          label: 'En Cocina',
          icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          )
        };

      case 'PARA_RECOGER':
        return {
          label: 'Para Recoger',
          icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          )
        };

      case 'LISTO_PARA_PAGAR':
        return {
          label: 'Listo para Pagar',
          icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <polyline points="16 11 18 13 22 9"></polyline>
            </svg>
          )
        };

      case 'UNIFICADA':
        return {
          label: 'Unificada',
          icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          )
        };

      case 'LIBRE':
      default:
        return {
          label: 'Libre',
          icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="2" x2="6" y2="4"></line>
              <line x1="10" y1="2" x2="10" y2="4"></line>
              <line x1="14" y1="2" x2="14" y2="4"></line>
            </svg>
          )
        };
    }
  };

  const stateInfo = renderContentByState();

  return (
    <div
      className={`mesa-card-box state-${estado.toLowerCase()}`}
      onClick={onClick}
    >
      {/* Ícono representativo del estado */}
      <div className="mesa-card-icon">
        {stateInfo.icon}
      </div>

      {/* Título / Número de Mesa */}
      <h3 className="mesa-card-title">Mesa #{numero}</h3>

      {/* Información secundaria si la mesa está ocupada */}
      {estado !== 'LIBRE' && monto > 0 && (
        <span className="mesa-card-amount">S/ {monto.toFixed(2)}</span>
      )}
    </div>
  );
};

export default MesaCard;