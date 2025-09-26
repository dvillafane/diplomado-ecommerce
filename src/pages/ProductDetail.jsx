
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ConfirmModal from '../components/ConfirmModal';

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart, calculateFinalPrice, discount } = useStore();
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
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
    if (quantity <= 0 || quantity > product.stock) {
      setAddedMsg(`Cantidad inválida. Stock disponible: ${product.stock}`);
      setTimeout(() => setAddedMsg(''), 2000);
      return;
    }
    setAdding(true);
    try {
      const added = addToCart({ ...product, quantity }, navigate);
      if (added) {
        setAddedMsg('Producto agregado al carrito');
        setShowModal(true); // Show modal after adding to cart
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

  const handleIncrease = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= product.stock) {
      setQuantity(value);
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
            <div className="d-flex align-items-center mb-3">
              <div className="h3 me-3 text-success fw-bold">
                {formatCurrency(finalPrice)}
              </div>
            </div>
            <div className="d-flex align-items-center mb-3">
              <button
                className="btn btn-outline-dark btn-sm me-1"
                onClick={handleDecrease}
                disabled={quantity <= 1 || adding}
                aria-label={`Disminuir cantidad de ${product.name}`}
              >
                -
              </button>
              <input
                type="number"
                className="form-control form-control-sm mx-2"
                value={quantity}
                onChange={handleQuantityChange}
                style={{ width: '60px', textAlign: 'center' }}
                min="1"
                max={product.stock}
                aria-label={`Cantidad de ${product.name}`}
              />
              <button
                className="btn btn-outline-dark btn-sm me-3"
                onClick={handleIncrease}
                disabled={quantity >= product.stock || adding}
                aria-label={`Aumentar cantidad de ${product.name}`}
              >
                +
              </button>
              <button
                className="btn btn-success"
                onClick={handleAdd}
                disabled={adding || product.stock === 0}
              >
                {adding ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>
          </div>
          {addedMsg && <div className="alert alert-success py-1 px-2">{addedMsg}</div>}
        </div>
      </div>
      <ConfirmModal
        show={showModal}
        title="Producto Agregado"
        text="El producto se ha agregado al carrito. ¿Qué deseas hacer?"
        confirmText="Ir al carrito"
        onCancel={() => {
          setShowModal(false);
          navigate('/tienda'); // Redirect to shop on cancel
        }}
        onConfirm={() => {
          setShowModal(false);
          navigate('/carrito');
        }}
      />
    </div>
  );
};

export default ProductDetail;
