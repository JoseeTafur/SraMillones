import React, { useState, useEffect } from 'react';
import './ConfirmDialog.css';

export const ConfirmDialog = ({
  isOpen,
  title = '¿Está seguro de realizar esta acción?',
  message = 'Esta acción no se podrá deshacer.',
  confirmText = 'Sí, Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Maneja la entrada y salida suave
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250); // Tiempo exacto que dura la animación CSS (250ms)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleClose = (callback) => {
    setIsClosing(true);
    setTimeout(() => {
      if (callback) callback();
    }, 250);
  };

  const renderIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="confirm-icon-box danger">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="confirm-icon-box warning">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        );
      default:
        return (
          <div className="confirm-icon-box info">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`confirm-backdrop ${isClosing ? 'closing' : ''}`}>
      <div className={`confirm-card-dialog ${isClosing ? 'closing' : ''}`}>
        <div className="confirm-header">
          {renderIcon()}
          <h3 className="confirm-title">{title}</h3>
        </div>

        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button 
            type="button" 
            className="btn-confirm-cancel" 
            onClick={() => handleClose(onCancel)}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`btn-confirm-accept ${type}`} 
            onClick={() => handleClose(onConfirm)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;