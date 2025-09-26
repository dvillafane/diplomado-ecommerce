// src/components/SkeletonCard.jsx
// Componente funcional que muestra un placeholder animado para tarjetas durante la carga de datos
const SkeletonCard = ({ height = 200 }) => (
  // Contenedor principal de la tarjeta con estilos de sombra y sin bordes
  <div className="card h-100 border-0 shadow-sm">
    {/* Área superior que simula una imagen con animación de pulso */}
    <div style={{ height }} className="bg-secondary animate-pulse"></div>
    {/* Cuerpo de la tarjeta con placeholders para texto */}
    <div className="card-body">
      <div className="placeholder-glow">
        {/* Placeholder para el título, ocupando el 60% del ancho */}
        <span className="placeholder col-6"></span>
        {/* Placeholder para el texto descriptivo, ocupando el 70% del ancho */}
        <p className="placeholder col-7 mt-2"></p>
      </div>
    </div>
  </div>
);

export default SkeletonCard;