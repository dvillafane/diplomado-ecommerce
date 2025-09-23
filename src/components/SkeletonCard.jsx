//src/components/SkeletonCard.jsx
const SkeletonCard = ({ height = 200 }) => (
  <div className="card h-100 border-0 shadow-sm">
    <div style={{ height }} className="bg-secondary animate-pulse"></div>
    <div className="card-body">
      <div className="placeholder-glow">
        <span className="placeholder col-6"></span>
        <p className="placeholder col-7 mt-2"></p>
      </div>
    </div>
  </div>
);

export default SkeletonCard;
