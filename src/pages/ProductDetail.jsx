import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart, calculateFinalPrice, discount } = useStore();
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const navigate = useNavigate();

  const product = (products || []).find(p => String(p.id) === String(id));

  useEffect(() => {
    if (!product) {
      const t = setTimeout(() => navigate('/tienda'), 2500);
      return () => clearTimeout(t);
    }
  }, [product, navigate]);

  if (!product) return (
    <div className="container my-4 text-muted">
      Producto no encontrado. <Link to="/tienda">Volver a la tienda</Link>.
    </div>
  );

  const onImgError = (e) => e.target.src = '/placeholder.png';

  const handleAdd = () => {
    setAdding(true);
    try {
      const added = addToCart({ ...product, quantity: 1 }, navigate);
      if (added) {
        setAddedMsg('Producto agregado al carrito');
        setTimeout(() => setAddedMsg(''), 2000);
      } else {
        setAddedMsg('Debes iniciar sesión para agregar productos');
        setTimeout(() => setAddedMsg(''), 2000);
      }
    } catch (err) {
      console.error(err);
      setAddedMsg(err.message || 'Error al agregar al carrito');
      setTimeout(() => setAddedMsg(''), 2000);
    } finally {
      setAdding(false);
    }
  };

  const finalPrice = calculateFinalPrice(product.price, product.discount);
  const totalDiscount = 1 - (1 - (product.discount || 0)) * (1 - discount);
  const showDiscount = totalDiscount > 0;

  return (
    <div className="container my-4">
      <Helmet>
        <title>{product.name} - Tienda</title>
        <meta name="description" content={product.description || `Detalles de ${product.name} en nuestra tienda online.`} />
      </Helmet>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="border rounded overflow-hidden" style={{ height: 400 }}>
            <img
              src={product.image || '/placeholder.png'}
              alt={product.name}
              onError={onImgError}
              className="w-100 h-100"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        </div>
        <div className="col-md-6">
          <h1 className="mb-2">{product.name}</h1>
          <p className="text-muted mb-2">{product.category || 'Sin categoría'}</p>
          <p className="mb-3">{product.description}</p>
          <div className="mb-3">
            {showDiscount && (
              <div className="h4 mb-2">
                <span style={{ textDecoration: 'line-through' }}>
                  {formatCurrency(product.price)}
                </span>{' '}
                -{(totalDiscount * 100).toFixed(0)}%
              </div>
            )}
            <div className="d-flex align-items-center">
              <div className="h3 me-3 text-success fw-bold">
                {formatCurrency(finalPrice)}
              </div>
              <button className="btn btn-success" onClick={handleAdd} disabled={adding}>
                {adding ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>
          </div>
          {addedMsg && <div className="alert alert-success py-1 px-2">{addedMsg}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;