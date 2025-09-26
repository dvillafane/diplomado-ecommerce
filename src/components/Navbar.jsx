// src/pages/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { auth } from '../services/firebase';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '../utils/constants';

const Navbar = () => {
  const { user, fetchProducts, cart } = useStore();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Calculate total items in cart
  const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      useStore.getState().setUser(null);
      navigate(ROUTES.HOME);
      fetchProducts();
    } catch (err) {
      console.error('Sign out error', err);
      alert('Error cerrando sesión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        dropdownMenuRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <nav className="navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <Link className="navbar-brand fw-bold" to={ROUTES.HOME}>
          <span className="me-2">🛍️</span> Tienda
        </Link>
        <button
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
        >
          <span></span><span></span><span></span>
        </button>
        <div className={`menu-container ${menuOpen ? 'open' : ''}`}>
          <ul className="menu-links d-flex align-items-center gap-3">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to={ROUTES.SHOP} onClick={() => setMenuOpen(false)}>
                <span className="material-icons">storefront</span>
                {menuOpen && <span>Tienda</span>}
              </Link>
            </li>
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
                      {totalCartItems}
                    </span>
                  )}
                  {menuOpen && <span>Carrito</span>}
                </Link>
              </li>
            )}
            {user && user.isAdmin && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to={ROUTES.ADMIN} onClick={() => setMenuOpen(false)}>
                  <span className="material-icons">admin_panel_settings</span>
                  {menuOpen && <span>Admin</span>}
                </Link>
              </li>
            )}
          </ul>
          <div className="auth-buttons position-relative d-flex align-items-center gap-3">
            {user ? (
              <>
                <div className="d-none d-lg-block position-relative">
                  <button
                    className="btn btn-link p-0 border-0"
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