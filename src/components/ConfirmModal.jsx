// src/components/ConfirmModal.jsx
// Componente funcional que muestra un modal de confirmación personalizable
import { useEffect, useRef } from 'react';

// Recibe props para controlar la visibilidad, título, texto y acciones del modal
const ConfirmModal = ({ show, title = 'Confirmar', text = '¿Estás seguro?', onCancel, onConfirm, confirmText = 'Aceptar' }) => {
  // Referencia al elemento del modal para gestionar el foco
  const modalRef = useRef(null);
  
  // Efecto para manejar la visibilidad del modal y el estilo del body
  useEffect(() => {
    if (show) {
      // Añade clase para deshabilitar el scroll en el body cuando el modal está visible
      document.body.classList.add('modal-open');
      // Enfoca el modal para accesibilidad
      modalRef.current?.focus();
    } else {
      // Remueve la clase cuando el modal se oculta
      document.body.classList.remove('modal-open');
    }
    // Limpieza al desmontar el componente para asegurar que el body no quede bloqueado
    return () => document.body.classList.remove('modal-open');
  }, [show]); // Dependencia en 'show' para ejecutar el efecto cuando cambia

  // Si el modal no debe mostrarse, no renderiza nada
  if (!show) return null;

  // Renderiza el modal con fondo oscurecido y contenido centrado
  return (
    <div className="modal-backdrop show" style={{ opacity: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="modal d-block" tabIndex="-1" aria-modal="true" role="dialog" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ opacity: 1 }}>
            {/* Encabezado del modal con título y botón de cierre */}
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar"></button>
            </div>
            {/* Cuerpo del modal con el mensaje de confirmación */}
            <div className="modal-body">
              <p>{text}</p>
            </div>
            {/* Pie del modal con botones de acción */}
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