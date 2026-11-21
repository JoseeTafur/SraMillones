import React, { useState, useEffect, useRef } from 'react';
import './Modal.css';

export const Modal = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = '560px',
  isSubmitting: externalSubmitting
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const bodyRef = useRef(null);

  const isSubmitting = externalSubmitting !== undefined ? externalSubmitting : internalSubmitting;

  // Maneja la sincronización de entrada y salida suave
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setInternalSubmitting(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        setInternalSubmitting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sincroniza el bloqueo y el spinner en los botones del modal
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const saveBtn = container.querySelector('.btn-save-senior, button[type="submit"]');
    const cancelBtn = container.querySelector('.btn-cancel-senior');

    if (saveBtn) {
      saveBtn.disabled = isSubmitting;
      saveBtn.classList.toggle('is-loading', isSubmitting);
    }
    if (cancelBtn) {
      cancelBtn.disabled = isSubmitting;
    }
  }, [isSubmitting, shouldRender]);

  if (!shouldRender) return null;

  const handleClose = () => {
    if (isSubmitting) return; // Evita cerrar a mitad de un guardado
    setIsClosing(true);
    onClose();
  };

  // Intercepta cualquier <form onSubmit={...}> dentro del Modal
  const handleFormSubmitCapture = (e) => {
    if (isSubmitting) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Buscamos la prop onSubmit en el árbol de React children para esperar su Promesa
    const findOnSubmit = (nodes) => {
      let handler = null;
      React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child) || handler) return;
        if (child.type === 'form' && typeof child.props.onSubmit === 'function') {
          handler = child.props.onSubmit;
        } else if (child.props && child.props.children) {
          handler = findOnSubmit(child.props.children);
        }
      });
      return handler;
    };

    const formOnSubmit = findOnSubmit(children);
    if (formOnSubmit) {
      e.preventDefault();
      e.stopPropagation();
      setInternalSubmitting(true);

      Promise.resolve()
        .then(() => formOnSubmit(e))
        .finally(() => {
          setInternalSubmitting(false);
        });
    }
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
            disabled={isSubmitting}
            title="Cerrar ventana"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Contenido dinámico del Modal */}
        <div
          className="global-modal-body"
          ref={bodyRef}
          onSubmitCapture={handleFormSubmitCapture}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;