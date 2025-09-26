// src/pages/Shop.jsx
// Componente funcional que representa la página de la tienda, mostrando productos con filtros de búsqueda y categorías
import { Link } from 'react-router-dom';
import useStore from '../store/store';
import { useEffect, useState, useMemo } from 'react';
import SkeletonCard from '../components/SkeletonCard';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/format';
import { Helmet } from 'react-helmet-async';
import { ROUTES } from '../utils/constants';

// Componente principal de la página de la tienda
const Shop = () => {
  // Obtiene datos y funciones del store global
  const {
    products,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    fetchProducts,
    loading: productsLoading,
    calculateFinalPrice,
    discount,
  } = useStore();
  const [localLoading, setLocalLoading] = useState(false); // Estado local para la carga inicial
  const [toast, setToast] = useState(null); // Estado para notificaciones tipo toast

  // Efecto para cargar los productos al montar el componente
  useEffect(() => {
    setLocalLoading(true);
    fetchProducts().finally(() => setLocalLoading(false)); // Carga productos desde Firestore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtra productos según la búsqueda y la categoría seleccionada
  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchName = !q || (p.name || '').toLowerCase().includes(q); // Filtra por nombre
      const matchCategory = !selectedCategory || (p.category || '') === selectedCategory; // Filtra por categoría
      return matchName && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Maneja errores de carga de imágenes
  const onImgError = (e) => { e.target.src = '/placeholder.png'; };

  // Renderiza la interfaz de la página de la tienda
  return (
    <div className="container my-4">
      {/* Configura metadatos SEO para la página */}
      <Helmet>
        <title>Tienda - E-commerce</title>
        <meta name="description" content="Explora todos los productos en nuestra tienda online." />
      </Helmet>
      <h1 className="mb-4">Tienda</h1>
      {/* Filtros de búsqueda y categoría */}
      <div className="row mb-3 g-2 align-items-center">
        <div className="col-md-6">
          <input
            autoFocus
            type="text"
            className="form-control"
            placeholder="Buscar productos..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar productos"
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Seleccionar categoría"
          >
            <option value="">Todas las categorías</option>
            {(categories || []).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2 d-grid">
          <button
            className="btn btn-outline-secondary"
            onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
            aria-label="Limpiar filtros"
          >
            Limpiar
          </button>
        </div>
      </div>
      {/* Muestra esqueletos de carga mientras se obtienen los productos */}
      {(localLoading || productsLoading) ? (
        <div className="row">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="col-md-4 mb-4">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        // Mensaje si no se encuentran productos
        <div className="text-center text-muted py-5">
          No se encontraron productos. Revisa tu búsqueda o selecciona otra categoría.
          <div className="mt-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                setLocalLoading(true);
                fetchProducts().finally(() => setLocalLoading(false));
                setToast({ type: 'info', text: 'Reintentando...' });
              }}
            >
              Volver a intentar
            </button>
          </div>
        </div>
      ) : (
        // Renderiza la lista de productos filtrados
        <div className="row">
          {filteredProducts.map(product => {
            const finalPrice = calculateFinalPrice(product.price, product.discount); // Calcula precio final
            const totalDiscount = 1 - (1 - (product.discount || 0)) * (1 - discount); // Combina descuentos
            const showDiscount = totalDiscount > 0;
            const isOutOfStock = product.stock === 0;
            return (
              <div key={product.id} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm border-0 hover-zoom">
                  {/* Imagen del producto con indicador de agotado */}
                  <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                    {isOutOfStock && (
                      <span className="badge bg-danger position-absolute top-0 start-0">Agotado</span>
                    )}
                    <img
                      src={product.image || '/placeholder.png'}
                      alt={product.name}
                      onError={onImgError}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text text-muted mb-2">{product.category || 'Sin categoría'}</p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <div>
                        {showDiscount ? (
                          // Muestra precio con descuento si aplica
                          <>
                            <div className="mb-1">
                              <span style={{ textDecoration: 'line-through' }}>
                                {formatCurrency(product.price)}
                              </span>{' '}
                              -{(totalDiscount * 100).toFixed(0)}%
                            </div>
                            <div className="text-success fw-bold">
                              {formatCurrency(finalPrice)}
                            </div>
                          </>
                        ) : (
                          // Muestra precio original si no hay descuento
                          <div className="fw-bold">{formatCurrency(product.price)}</div>
                        )}
                      </div>
                      {/* Enlace para ver detalles del producto */}
                      <Link
                        to={ROUTES.PRODUCT(product.id)}
                        className={`btn btn-outline-primary btn-sm ${isOutOfStock ? 'disabled' : ''}`}
                        aria-disabled={isOutOfStock}
                      >
                        Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Contenedor para notificaciones tipo toast */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Shop;