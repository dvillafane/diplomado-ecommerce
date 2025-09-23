// src/components/SpinnerButton.jsx
const SpinnerButton = ({ loading, children, className = 'btn-primary', ...props }) => (
  <button className={`btn ${className}`} disabled={loading} {...props}>
    {loading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {children}
      </>
    ) : children}
  </button>
);

export default SpinnerButton;
