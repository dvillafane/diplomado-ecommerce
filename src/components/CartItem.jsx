// src/components/CartItem.jsx
import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import useStore from '../store/store';
import '../styles/Cart.css';

const CartItem = ({ item, updateCartQuantity, removeFromCart }) => {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const { calculateFinalPrice } = useStore(); // Importa la función del store

  const handleIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateCartQuantity(item.id, newQuantity);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      updateCartQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  const onImgError = (e) => {
    e.target.src = '/placeholder.png';
  };

  return (
    <div className="card mb-3 shadow-sm position-relative cart-item">
      <button
        className="btn btn-sm btn-danger cart-remove-btn"
        onClick={handleRemove}
        aria-label={`Eliminar ${item.name} del carrito`}
      >
        ×
      </button>
      <div className="card-body p-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
          <div className="cart-item-image-container me-3">
            <img
              src={item.image || '/placeholder.png'}
              alt={item.name}
              onError={onImgError}
              className="img-fluid"
              loading="lazy"
            />
          </div>
          <div className="flex-grow-1">
            <strong className="text-dark">{item.name}</strong>
            <div className="d-flex flex-column">
              <div className="text-muted small mb-2">
                {formatCurrency(calculateFinalPrice(item.price, item.discount))}
                {item.discount > 0 && (
                  <span className="text-success fw-bold ms-2">
                    {(item.discount * 100).toFixed(0)}% OFF
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center">
                <button className="btn btn-outline-dark btn-sm me-1" onClick={handleDecrease} aria-label={`Disminuir cantidad de ${item.name}`}>
                  -
                </button>
                <span className="mx-2 fw-bold text-dark cart-quantity">
                  {quantity}
                </span>
                <button className="btn btn-outline-dark btn-sm me-1" onClick={handleIncrease} aria-label={`Aumentar cantidad de ${item.name}`}>
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;