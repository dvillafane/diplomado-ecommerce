// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect, lazy } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ErrorBoundary } from '@sentry/react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import useStore from './store/store';
import { auth } from './services/firebase';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Admin = lazy(() => import('./pages/Admin'));
const History = lazy(() => import('./pages/History'));

const App = () => {
  const { setUser, fetchProducts, authReady } = useStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setUser(user));
    fetchProducts();
    return () => unsubscribe();
  }, [setUser, fetchProducts]);

  if (!authReady) {
    return (
      <div className="container my-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted mt-2">Cargando...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="container my-4 alert alert-danger">Error en la aplicación. Por favor, intenta de nuevo.</div>}>
      <HelmetProvider>
        <Router>
          <Helmet>
            <title>Tienda - E-commerce</title>
            <meta name="description" content="Compra productos en nuestra tienda online." />
          </Helmet>
          <Navbar />
          <Suspense fallback={<div className="container my-4 text-center">Cargando...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tienda" element={<Shop />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              <Route path="/historial" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="*" element={<div className="container my-4 alert alert-danger">Página no encontrada</div>} />
            </Routes>
          </Suspense>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;