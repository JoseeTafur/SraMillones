import React, { useEffect, useState } from 'react';
import './Toast.css';

export const Toast = ({ type = 'info', title, message, onClose, duration = 5000 }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!onClose) return;

    // Inicia la animación de desvanecimiento 400ms antes de cerrarse completamente
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration - 400);

    // Cierra el Toast al finalizar el tiempo total
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose, duration]);

  const handleManualClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <div className={`toast-card toast-${type} ${isLeaving ? 'leaving' : ''}`}>
      {/* Ola decorativa */}
      <svg className="toast-wave" viewBox="0 0 1440 320">
        <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Ícono */}
      <div className="toast-icon-container">
        {renderIcon()}
      </div>

      {/* Mensaje */}
      <div className="toast-text-container">
        <p className="toast-title">{title}</p>
        <p className="toast-subtext">{message}</p>
      </div>

      {/* Cerrar manualmente */}
      <svg
        className="toast-cross-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        onClick={handleManualClose}
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  );
};

export default Toast;