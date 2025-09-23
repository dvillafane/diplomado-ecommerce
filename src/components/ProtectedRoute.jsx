// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useStore from '../store/store';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, authReady } = useStore();

  if (!authReady) {
    return (
      <div className="container my-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted mt-2">Verificando autenticación...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" />;
  return children;
};

export default ProtectedRoute;