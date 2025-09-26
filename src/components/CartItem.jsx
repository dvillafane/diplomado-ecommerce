// src/components/CartItem.jsx
// Componente funcional que representa un ítem individual en el carrito de compras
import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import useStore from '../store/store';
import '../styles/Cart.css';

// Recibe el objeto 'item' y funciones para actualizar y eliminar ítems del carrito
const CartItem = ({ item, updateCartQuantity, removeFromCart }) => {
  // Estado local para manejar la cantidad del ítem en el carrito
  const [quantity, setQuantity] = useState(item.quantity || 1);
  // Obtiene la función para calcular el precio final desde el store global
  const { calculateFinalPrice } = useStore();

  // Función para incrementar la cantidad del ítem
  const handleIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateCartQuantity(item.id, newQuantity); // Actualiza la cantidad en el carrito
  };

  // Función para disminuir la cantidad del ítem, asegurando que no sea menor a 1
  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      updateCartQuantity(item.id, newQuantity); // Actualiza la cantidad en el carrito
    }
  };

  // Función para eliminar el ítem del carrito
  const handleRemove = () => {
    removeFromCart(item.id); // Llama a la función proporcionada para eliminar el ítem
  };

  // Maneja errores de carga de imágenes, mostrando una imagen predeterminada
  const onImgError = (e) => {
    e.target.src = '/placeholder.png';
  };

  // Renderiza la interfaz del ítem en el carrito
  return (
    <div className="card mb-3 shadow-sm position-relative cart-item">
      {/* Botón para eliminar el ítem del carrito */}
      <button
        className="btn btn-sm btn-danger cart-remove-btn"
        onClick={handleRemove}
        aria-label={`Eliminar ${item.name} del carrito`}
      >
        ×
      </button>
      <div className="card-body p-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
          {/* Contenedor de la imagen del producto */}
          <div className="cart-item-image-container me-3">
            <img
              src={item.image || '/placeholder.png'} // Usa imagen del ítem o una predeterminada
              alt={item.name}
              onError={onImgError} // Maneja errores de carga de imagen
              className="img-fluid"
              loading="lazy" // Optimización de carga de imágenes
            />
          </div>
          <div className="flex-grow-1">
            {/* Nombre del producto */}
            <strong className="text-dark">{item.name}</strong>
            <div className="d-flex flex-column">
              <div className="text-muted small mb-2">
                {/* Precio formateado con posible descuento */}
                {formatCurrency(calculateFinalPrice(item.price, item.discount))}
                {item.discount > 0 && (
                  <span className="text-success fw-bold ms-2">
                    {(item.discount * 100).toFixed(0)}% OFF
                  </span>
                )}
              </div>
              {/* Controles para ajustar la cantidad del ítem */}
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-dark btn-sm me-1"
                  onClick={handleDecrease}
                  aria-label={`Disminuir cantidad de ${item.name}`}
                >
                  -
                </button>
                <span className="mx-2 fw-bold text-dark cart-quantity">
                  {quantity}
                </span>
                <button
                  className="btn btn-outline-dark btn-sm me-1"
                  onClick={handleIncrease}
                  aria-label={`Aumentar cantidad de ${item.name}`}
                >
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