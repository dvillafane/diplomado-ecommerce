// src/App.jsx
// Componente principal de la aplicación que configura el enrutamiento y la autenticación
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect, lazy } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ErrorBoundary } from '@sentry/react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import useStore from './store/store';
import { auth } from './services/firebase';
import { ROUTES } from './utils/constants';

// Carga diferida (lazy loading) de las páginas para optimizar el rendimiento
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Admin = lazy(() => import('./pages/Admin'));
const History = lazy(() => import('./pages/History'));

// Componente principal de la aplicación
const App = () => {
  // Obtiene funciones y estado del store global
  const { setUser, fetchProducts, authReady } = useStore();

  // Efecto para manejar la autenticación y cargar productos iniciales
  useEffect(() => {
    // Escucha cambios en el estado de autenticación de Firebase
    const unsubscribe = auth.onAuthStateChanged(user => setUser(user));
    fetchProducts(); // Carga los productos desde Firestore al montar la aplicación
    return () => unsubscribe(); // Limpia el listener al desmontar
  }, [setUser, fetchProducts]);

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

  // Renderiza la estructura principal de la aplicación
  return (
    // ErrorBoundary captura errores inesperados y muestra un mensaje de fallback
    <ErrorBoundary fallback={<div className="container my-4 alert alert-danger">Error en la aplicación. Por favor, intenta de nuevo.</div>}>
      {/* Proveedor para manejar metadatos SEO con react-helmet-async */}
      <HelmetProvider>
        <Router>
          {/* Configuración de metadatos SEO por defecto para toda la aplicación */}
          <Helmet>
            <title>Tienda - E-commerce</title>
            <meta name="description" content="Compra productos en nuestra tienda online." />
          </Helmet>
          {/* Barra de navegación presente en todas las páginas */}
          <Navbar />
          {/* Suspense maneja la carga asíncrona de componentes con lazy loading */}
          <Suspense fallback={<div className="container my-4 text-center">Cargando...</div>}>
            {/* Definición de rutas de la aplicación con React Router */}
            <Routes>
              <Route path={ROUTES.HOME} element={<Home />} /> {/* Página principal */}
              <Route path={ROUTES.SHOP} element={<Shop />} /> {/* Página de la tienda */}
              <Route path={ROUTES.PRODUCT(':id')} element={<ProductDetail />} /> {/* Detalles de un producto */}
              {/* Rutas protegidas que requieren autenticación */}
              <Route path={ROUTES.CART} element={<ProtectedRoute><Cart /></ProtectedRoute>} /> {/* Carrito de compras */}
              <Route path={ROUTES.LOGIN} element={<Login />} /> {/* Página de inicio de sesión */}
              <Route path={ROUTES.REGISTER} element={<Register />} /> {/* Página de registro */}
              {/* Ruta protegida solo para administradores */}
              <Route path={ROUTES.ADMIN} element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} /> {/* Panel de administración */}
              <Route path={ROUTES.HISTORY} element={<ProtectedRoute><History /></ProtectedRoute>} /> {/* Historial de compras */}
              {/* Ruta fallback para páginas no encontradas */}
              <Route path="*" element={<div className="container my-4 alert alert-danger">Página no encontrada</div>} />
            </Routes>
          </Suspense>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;