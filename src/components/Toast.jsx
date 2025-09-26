// src/components/Toast.jsx
// Componente funcional que muestra una notificación tipo toast con opciones personalizables
import { useEffect } from 'react';

// Recibe props para tipo de notificación, texto, función de cierre y duración
const Toast = ({ type = 'info', text = '', onClose = () => {}, duration = 3000 }) => {
  // Efecto para cerrar automáticamente el toast después de la duración especificada
  useEffect(() => {
    const t = setTimeout(onClose, duration); // Configura un temporizador para cerrar el toast
    return () => clearTimeout(t); // Limpia el temporizador al desmontar el componente
  }, [onClose, duration]); // Dependencias para re-ejecutar el efecto si cambian

  // Determina el color de fondo según el tipo de notificación
  const bg = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';

  // Renderiza el toast con el texto y un botón de cierre
  return (
    <div className={`toast show text-white ${bg}`} role="alert" aria-live="assertive" aria-atomic="true" style={{ minWidth: 220 }}>
      <div className="toast-body">
        {text} {/* Muestra el mensaje del toast */}
        {/* Botón para cerrar manualmente el toast */}
        <button type="button" className="btn-close btn-close-white float-end" onClick={onClose} aria-label="Cerrar"></button>
      </div>
    </div>
  );
};

export default Toast;