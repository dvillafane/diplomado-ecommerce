// src/pages/Navbar.jsx
// Componente funcional que representa la barra de navegación de la aplicación
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { auth } from '../services/firebase';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '../utils/constants';

// Componente principal de la barra de navegación
const Navbar = () => {
  // Obtiene el estado del usuario, función para cargar productos y carrito desde el store
  const { user, fetchProducts, cart } = useStore();
  // Estados para controlar la carga, el menú móvil y el menú de usuario
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  // Referencias para gestionar clics fuera del menú desplegable
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Calcula el total de ítems en el carrito sumando las cantidades
  const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Función para cerrar sesión del usuario
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut(); // Cierra sesión en Firebase
      useStore.getState().setUser(null); // Limpia el estado del usuario
      navigate(ROUTES.HOME); // Redirige a la página principal
      fetchProducts(); // Recarga los productos
    } catch (err) {
      console.error('Sign out error', err);
      alert('Error cerrando sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cerrar el menú móvil en pantallas grandes al redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && menuOpen) {
        setMenuOpen(false); // Cierra el menú si la pantalla es mayor a 992px
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Efecto para cerrar el menú de usuario al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        dropdownMenuRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false); // Cierra el menú desplegable
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Renderiza la barra de navegación
  return (
    <nav className="navbar">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Logo y enlace a la página principal */}
        <Link className="navbar-brand fw-bold" to={ROUTES.HOME}>
          <span className="me-2">🛍️</span> Tienda
        </Link>
        {/* Botón hamburguesa para menú móvil */}
        <button
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
        >
          <span></span><span></span><span></span>
        </button>
        {/* Contenedor de enlaces y botones de autenticación */}
        <div className={`menu-container ${menuOpen ? 'open' : ''}`}>
          <ul className="menu-links d-flex align-items-center gap-3">
            {/* Enlace a la tienda */}
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to={ROUTES.SHOP} onClick={() => setMenuOpen(false)}>
                <span className="material-icons">storefront</span>
                {menuOpen && <span>Tienda</span>}
              </Link>
            </li>
            {/* Enlace al carrito (visible si hay usuario) */}
            {user && (
              <li className="nav-item position-relative">
                <Link
                  className="nav-link d-flex align-items-center gap-2"
                  to={ROUTES.CART}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-icons">shopping_cart</span>
                  {totalCartItems > 0 && (
                    <span className="badge bg-danger rounded-circle position-absolute" style={{ top: '-8px', right: '-8px', fontSize: '0.7rem', padding: '4px 8px' }}>
                      {totalCartItems} {/* Muestra el número de ítems en el carrito */}
                    </span>
                  )}
                  {menuOpen && <span>Carrito</span>}
                </Link>
              </li>
            )}
            {/* Enlace al panel de administración (visible si el usuario es admin) */}
            {user && user.isAdmin && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to={ROUTES.ADMIN} onClick={() => setMenuOpen(false)}>
                  <span className="material-icons">admin_panel_settings</span>
                  {menuOpen && <span>Admin</span>}
                </Link>
              </li>
            )}
          </ul>
          {/* Sección de autenticación */}
          <div className="auth-buttons position-relative d-flex align-items-center gap-3">
            {user ? (
              <>
                {/* Menú de usuario para pantallas grandes */}
                <div className="d-none d-lg-block position-relative">
                  <button
                    className="btn p-0 border-0"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    ref={dropdownRef}
                    aria-label="Menú de usuario"
                  >
                    <span className="material-icons fs-3">account_circle</span>
                  </button>
                  {userMenuOpen && (
                    <div className="dropdown-menu show mt-2 shadow-sm dropdown-menu-left" ref={dropdownMenuRef}>
                      <Link
                        className="dropdown-item"
                        to={ROUTES.HISTORY}
                        onClick={() => {
                          setUserMenuOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        <span className="material-icons me-2">history</span>
                        Historial de compras
                      </Link>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleSignOut}
                        disabled={loading}
                      >
                        <span className="material-icons me-2">logout</span>
                        {loading ? 'Saliendo...' : 'Cerrar sesión'}
                      </button>
                    </div>
                  )}
                </div>
                {/* Menú de usuario para pantallas pequeñas */}
                <div className="d-block d-lg-none w-100">
                  <Link
                    className="nav-link d-flex align-items-center gap-2"
                    to={ROUTES.HISTORY}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-icons">history</span>
                    Historial de compras
                  </Link>
                  <button
                    className="nav-link d-flex align-items-center gap-2 text-danger border-0 bg-transparent"
                    onClick={handleSignOut}
                    disabled={loading}
                  >
                    <span className="material-icons">logout</span>
                    {loading ? 'Saliendo...' : 'Cerrar sesión'}
                  </button>
                </div>
              </>
            ) : (
              /* Botón de inicio de sesión para usuarios no autenticados */
              <Link
                className="btn btn-primary btn-sm w-100"
                to={ROUTES.LOGIN}
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;