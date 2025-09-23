// src/components/ConfirmModal.jsx
import { useEffect, useRef } from 'react';

const ConfirmModal = ({ show, title = 'Confirmar', text = '¿Estás seguro?', onCancel, onConfirm, confirmText = 'Aceptar' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
      modalRef.current?.focus();
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [show]);

  if (!show) return null;

  return (
    <div className="modal-backdrop show">
      <div className="modal d-block" tabIndex="-1" aria-modal="true" role="dialog" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              <p>{text}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
              <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;