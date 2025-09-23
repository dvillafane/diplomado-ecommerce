import { Link } from 'react-router-dom';
import useStore from '../store/store';
import { useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/format';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const { products, fetchProducts, calculateFinalPrice, discount } = useStore();
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = useMemo(() => products?.slice(0, 3) ?? [], [products]);
  const offers = useMemo(() => products?.filter(p => (p.discount || 0) > 0).slice(0, 3) ?? [], [products]);
  const popular = useMemo(() => [...(products || [])].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3), [products]);

  const ProductSection = ({ title, items }) => {
    const memoizedItems = useMemo(() => items.map(product => {
      const finalPrice = calculateFinalPrice(product.price, product.discount);
      const totalDiscount = 1 - (1 - (product.discount || 0)) * (1 - discount);
      return { ...product, finalPrice, totalDiscount };
    }), [items]);

    return (
      <section className="container my-5">
        <Helmet>
          <title>{title} - Tienda</title>
          <meta name="description" content={`Explora ${title.toLowerCase()} en nuestra tienda online.`} />
        </Helmet>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold">{title}</h2>
        </div>
        {memoizedItems.length === 0 ? (
          <div className="text-center py-5 text-muted">No hay {title.toLowerCase()} para mostrar.</div>
        ) : (
          <div className="row">
            {memoizedItems.map(product => {
              const showDiscount = product.totalDiscount > 0;
              const isOutOfStock = product.stock === 0;
              return (
                <div key={product.id} className="col-md-4 mb-4">
                  <div className="card h-100 shadow-sm border-0 hover-zoom">
                    <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                      {isOutOfStock && (
                        <span className="badge bg-danger position-absolute top-0 start-0">Agotado</span>
                      )}
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
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
                            <>
                              <div className="mb-1">
                                <span style={{ textDecoration: 'line-through' }}>
                                  {formatCurrency(product.price)}
                                </span>{' '}
                                -{(product.totalDiscount * 100).toFixed(0)}%
                              </div>
                              <div className="text-success fw-bold">
                                {formatCurrency(product.finalPrice)}
                              </div>
                            </>
                          ) : (
                            <div className="fw-bold">{formatCurrency(product.price)}</div>
                          )}
                        </div>
                        <Link
                          to={`/producto/${product.id}`}
                          className={`btn btn-outline-primary btn-sm ${isOutOfStock ? 'disabled' : ''}`}
                          aria-disabled={isOutOfStock}
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div>
      <section className="py-5 bg-light border-bottom">
        <div className="container d-flex flex-column flex-lg-row align-items-center">
          <div className="flex-fill mb-4 mb-lg-0">
            <h1 className="fw-bold text-primary">Bienvenido a la Tienda</h1>
            <p className="lead text-muted"> Una plataforma simple y rápida para explorar productos. Ideal para aprender, probar o comprar. </p>
            <div className="d-flex gap-3 mt-3">
              <Link to="/tienda" className="btn btn-primary btn-lg">Explorar</Link>
            </div>
          </div>
        </div>
      </section>
      <ProductSection title="Productos destacados" items={featured} />
      <ProductSection title="Ofertas" items={offers} />
      <ProductSection title="Productos populares" items={popular} />
    </div>
  );
};

export default Home;