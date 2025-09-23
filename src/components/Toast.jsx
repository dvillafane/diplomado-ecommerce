//src/components/Toast.jsx
import { useEffect } from 'react';

const Toast = ({ type = 'info', text = '', onClose = () => {}, duration = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const bg = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';
  return (
    <div className={`toast show text-white ${bg}`} role="alert" aria-live="assertive" aria-atomic="true" style={{ minWidth: 220 }}>
      <div className="toast-body">
        {text}
        <button type="button" className="btn-close btn-close-white float-end" onClick={onClose} aria-label="Cerrar"></button>
      </div>
    </div>
  );
};

export default Toast;
