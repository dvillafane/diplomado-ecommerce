// src/pages/ProductDetail.jsx
// Componente funcional que muestra los detalles de un producto específico y permite agregarlo al carrito
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ConfirmModal from '../components/ConfirmModal';
import { ROUTES } from '../utils/constants';

// Componente principal para la página de detalles del producto
const ProductDetail = () => {
  // Obtiene el ID del producto desde los parámetros de la URL
  const { id } = useParams();
  // Obtiene datos y funciones del store global
  const { products, addToCart, calculateFinalPrice, discount } = useStore();
  // Estados locales para gestionar la interacción del usuario
  const [adding, setAdding] = useState(false); // Estado para el proceso de agregar al carrito
  const [addedMsg, setAddedMsg] = useState(''); // Mensaje de retroalimentación
  const [quantity, setQuantity] = useState(1); // Cantidad seleccionada del producto
  const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal de confirmación
  const navigate = useNavigate(); // Hook para manejar la navegación

  // Encuentra el producto correspondiente al ID
  const product = (products || []).find(p => String(p.id) === String(id));

  // Efecto para redirigir si el producto no se encuentra
  useEffect(() => {
    if (!product) {
      const t = setTimeout(() => navigate(ROUTES.SHOP), 2500); // Redirige a la tienda tras 2.5s
      return () => clearTimeout(t); // Limpia el temporizador al desmontar
    }
  }, [product, navigate]);

  // Muestra mensaje si el producto no existe
  if (!product) return (
    <div className="container my-4 text-muted">
      Producto no encontrado. <Link to={ROUTES.SHOP}>Volver a la tienda</Link>.
    </div>
  );

  // Maneja errores de carga de imágenes
  const onImgError = (e) => e.target.src = '/placeholder.png';

  // Función para agregar el producto al carrito
  const handleAdd = () => {
    // Validación de cantidad
    if (quantity <= 0 || quantity > product.stock) {
      setAddedMsg(`Cantidad inválida. Stock disponible: ${product.stock}`);
      setTimeout(() => setAddedMsg(''), 2000);
      return;
    }
    setAdding(true); // Activa el estado de carga
    try {
      const added = addToCart({ ...product, quantity }, navigate); // Agrega al carrito
      if (added) {
        setAddedMsg('Producto agregado al carrito');
        setShowModal(true); // Muestra el modal de confirmación
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
      setAdding(false); // Desactiva el estado de carga
    }
  };

  // Función para aumentar la cantidad seleccionada
  const handleIncrease = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  // Función para disminuir la cantidad seleccionada
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Función para manejar cambios manuales en la cantidad
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= product.stock) {
      setQuantity(value);
    }
  };

  // Calcula el precio final y el descuento total
  const finalPrice = calculateFinalPrice(product.price, product.discount);
  const totalDiscount = 1 - (1 - (product.discount || 0)) * (1 - discount);
  const showDiscount = totalDiscount > 0;

  // Renderiza la interfaz de detalles del producto
  return (
    <div className="container my-4">
      {/* Configura metadatos SEO para la página */}
      <Helmet>
        <title>{product.name} - Tienda</title>
        <meta name="description" content={product.description || `Detalles de ${product.name} en nuestra tienda online.`} />
      </Helmet>
      <div className="row g-4">
        {/* Imagen del producto */}
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
        {/* Detalles del producto */}
        <div className="col-md-6">
          <h1 className="mb-2">{product.name}</h1>
          <p className="text-muted mb-2">{product.category || 'Sin categoría'}</p>
          <p className="mb-3">{product.description}</p>
          <div className="mb-3">
            {showDiscount && (
              // Muestra precio original y descuento si aplica
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
            {/* Controles para seleccionar cantidad y agregar al carrito */}
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
          {/* Mensaje de retroalimentación */}
          {addedMsg && <div className="alert alert-success py-1 px-2">{addedMsg}</div>}
        </div>
      </div>
      {/* Modal de confirmación tras agregar al carrito */}
      <ConfirmModal
        show={showModal}
        title="Producto Agregado"
        text="El producto se ha agregado al carrito. ¿Qué deseas hacer?"
        confirmText="Ir al carrito"
        onCancel={() => {
          setShowModal(false);
          navigate(ROUTES.SHOP); // Redirige a la tienda al cancelar
        }}
        onConfirm={() => {
          setShowModal(false);
          navigate(ROUTES.CART); // Redirige al carrito al confirmar
        }}
      />
    </div>
  );
};

export default ProductDetail;