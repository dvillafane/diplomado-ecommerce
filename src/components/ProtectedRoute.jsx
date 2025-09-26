// src/components/ProtectedRoute.jsx
// Componente funcional que protege rutas restringiendo el acceso según autenticación y permisos
import { Navigate } from 'react-router-dom';
import useStore from '../store/store';
import { ROUTES } from '../utils/constants'; // Importa las rutas definidas en un archivo de constantes

// Recibe los hijos (componentes a renderizar) y una bandera para rutas exclusivas de admin
const ProtectedRoute = ({ children, adminOnly = false }) => {
  // Obtiene el estado del usuario y el indicador de autenticación desde el store global
  const { user, authReady } = useStore();

  // Muestra un indicador de carga mientras se verifica la autenticación
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

  // Redirige al login si no hay usuario autenticado
  if (!user) return <Navigate to={ROUTES.LOGIN} />;
  // Redirige a la página principal si la ruta es solo para admin y el usuario no lo es
  if (adminOnly && !user.isAdmin) return <Navigate to={ROUTES.HOME} />;

  // Renderiza los componentes hijos si todas las condiciones de acceso se cumplen
  return children;
};

export default ProtectedRoute;