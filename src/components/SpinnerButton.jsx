// src/components/SpinnerButton.jsx
// Componente funcional que renderiza un botón con un indicador de carga opcional
const SpinnerButton = ({ loading, children, className = 'btn-primary', ...props }) => (
  // Botón con clase dinámica y deshabilitado cuando está en estado de carga
  <button className={`btn ${className}`} disabled={loading} {...props}>
    {loading ? (
      <>
        {/* Muestra un spinner pequeño y el contenido del botón cuando está cargando */}
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {children}
      </>
    ) : (
      // Muestra solo el contenido del botón cuando no está cargando
      children
    )}
  </button>
);

export default SpinnerButton;