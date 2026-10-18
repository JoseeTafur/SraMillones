import React, { useState, useEffect } from 'react';
import './Modal.css';

export const Modal = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = '560px'
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Maneja la sincronización de entrada y salida suave
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250); // Mismo tiempo que dura la animación CSS (250ms)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  return (
    <div className={`global-modal-backdrop ${isClosing ? 'closing' : ''}`}>
      <div 
        className={`global-modal-dialog ${isClosing ? 'closing' : ''}`}
        style={{ maxWidth }}
      >
        {/* Cabecera del Modal */}
        <div className="global-modal-header">
          <div className="global-modal-title-box">
            {icon && <span className="global-modal-icon">{icon}</span>}
            {title && <h3>{title}</h3>}
          </div>
          <button 
            type="button" 
            className="btn-close-global-modal" 
            onClick={handleClose} 
            title="Cerrar ventana"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Contenido dinámico del Modal */}
        <div className="global-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;