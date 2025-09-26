// src/pages/Cart.jsx
// Componente funcional que gestiona el carrito de compras y el proceso de checkout
import { useState } from 'react';
import useStore from '../store/store';
import { formatCurrency } from '../utils/format';
import Toast from '../components/Toast';
import CartItem from '../components/CartItem';
import '../styles/Cart.css';
import { DELIVERY_METHODS, ROUTES } from '../utils/constants';
import { Link } from 'react-router-dom'; // Importa Link para navegación

// Componente principal del carrito
const Cart = () => {
  // Obtiene datos y funciones del store global
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    coupon, 
    discount,
    appliedPromoCode,
    applyCoupon, 
    user, 
    createOrder, 
    calculateFinalPrice 
  } = useStore();
  
  // Estados locales para gestionar el proceso de checkout, cupones y dirección de entrega
  const [processing, setProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(DELIVERY_METHODS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Verifica si el usuario está autenticado
  if (!user) return <div className="container my-4 alert alert-danger">Debes iniciar sesión para ver el carrito.</div>;

  // Verifica si el usuario tiene un número de teléfono registrado
  if (!user.phone) {
    return (
      <div className="container my-4 alert alert-warning">
        Por favor, agrega un número de celular en tu{' '}
        <Link to={ROUTES.HISTORY}>perfil</Link> para continuar con la compra.
      </div>
    );
  }

  // Calcula el subtotal sumando los precios finales de los productos en el carrito
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = calculateFinalPrice(item.price, item.discount);
    return sum + (itemPrice * (item.quantity || 0));
  }, 0);

  // Calcula el descuento del cupón y asegura que el total no sea negativo
  const couponDiscount = discount > 0 ? Math.min(subtotal * discount, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount);
  
  // Calcula el total de ítems en el carrito
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Función para procesar el pedido
  const handleCheckout = async () => {
    // Validaciones antes de procesar
    if (cart.length === 0) {
      setMsg({ type: 'danger', text: 'El carrito está vacío.' });
      return;
    }
    if (deliveryMethod === DELIVERY_METHODS[0] && !deliveryAddress.trim()) {
      setMsg({ type: 'danger', text: 'Por favor, ingresa una dirección de entrega.' });
      return;
    }
    
    // Confirmación del pedido
    const confirmMessage = `¿Confirmar tu pedido por ${formatCurrency(finalTotal)}? Se enviará una notificación por WhatsApp.`;
    if (!window.confirm(confirmMessage)) return;

    setProcessing(true);
    try {
      // Crea el pedido en Firestore con los datos del carrito
      await createOrder({
        userId: user.uid,
        items: cart,
        total: finalTotal,
        deliveryMethod,
        deliveryAddress: deliveryMethod === DELIVERY_METHODS[0] ? deliveryAddress : null,
        appliedCoupon: coupon || null,
        couponDiscount: couponDiscount
      });
      setMsg({ type: 'success', text: 'Pedido procesado. Revisa la notificación en WhatsApp.' });
      setDeliveryAddress('');
      setCouponInput('');
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: err.message || 'Error al procesar pedido.' });
    } finally {
      setProcessing(false);
    }
  };

  // Función para aplicar un código promocional
  const tryApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setMsg({ type: 'danger', text: 'Ingresa un código de descuento.' });
      return;
    }

    setCouponLoading(true);
    try {
      const success = await applyCoupon(couponInput.trim());
      if (success) {
        setMsg({ type: 'success', text: `Cupón "${couponInput.toUpperCase()}" aplicado correctamente. Descuento: ${(discount * 100).toFixed(0)}%` });
        setCouponInput('');
      } else {
        setMsg({ type: 'danger', text: 'Código promocional inválido, expirado o sin usos disponibles.' });
      }
    } catch {
      setMsg({ type: 'danger', text: 'Error al validar el código promocional.' });
    } finally {
      setCouponLoading(false);
    }
  };

  // Función para remover un código promocional aplicado
  const removeCoupon = () => {
    useStore.setState({ discount: 0, coupon: '', appliedPromoCode: null });
    setMsg({ type: 'info', text: 'Código promocional removido.' });
  };

  // Renderiza la interfaz del carrito
  return (
    <div className="container my-4 cart-container">
      <h1 className="mb-4 text-dark">Mi carrito</h1>
      {/* Contenedor para notificaciones tipo toast */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        {msg && <Toast {...msg} onClose={() => setMsg(null)} />}
      </div>
      {cart.length === 0 ? (
        // Mensaje y enlace a la tienda si el carrito está vacío
        <div className="text-center py-5">
          <p className="text-muted">El carrito está vacío.</p>
          <Link to={ROUTES.SHOP} className="btn btn-primary">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {/* Lista de ítems en el carrito */}
          <div className="col-12 col-md-8">
            {cart.map(item => (
              <CartItem key={item.id} item={item} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
            ))}
          </div>
          {/* Resumen del pedido */}
          <div className="col-12 col-md-4">
            <div className="card p-3 shadow-sm">
              <h4 className="text-dark">Resumen del pedido</h4>
              
              {/* Selección del método de entrega */}
              <div className="mb-3">
                <label className="form-label">Método de entrega</label>
                <select
                  className="form-select"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                >
                  {DELIVERY_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              
              {/* Campo para la dirección de entrega (si aplica) */}
              {deliveryMethod === DELIVERY_METHODS[0] && (
                <div className="mb-3">
                  <label className="form-label">Dirección de entrega</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ingresa tu dirección completa"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Campo para aplicar cupón de descuento */}
              <div className="mb-3">
                <label className="form-label">Código de descuento</label>
                {coupon ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-success text-white px-3 py-2 rounded flex-grow-1">
                      <strong>{coupon}</strong> - {(discount * 100).toFixed(0)}% OFF
                      {appliedPromoCode?.description && (
                        <div className="small">{appliedPromoCode.description}</div>
                      )}
                    </div>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={removeCoupon}
                      title="Remover código"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: DESCUENTO15"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && !couponLoading && tryApplyCoupon()}
                    />
                    <button 
                      className="btn btn-outline-dark" 
                      onClick={tryApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>

              <hr />
              {/* Resumen de costos */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal ({totalItems} producto{totalItems !== 1 ? 's' : ''})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {couponDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento ({coupon})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total a pagar</strong>
                <strong className="text-success">{formatCurrency(finalTotal)}</strong>
              </div>

              {couponDiscount > 0 && (
                <div className="alert alert-success py-2 px-3 mb-3">
                  <small>¡Ahorras {formatCurrency(couponDiscount)} con tu código!</small>
                </div>
              )}

              {/* Botón para confirmar el pedido */}
              <button
                className="btn btn-success w-100 mb-3"
                onClick={handleCheckout}
                disabled={processing || cart.length === 0}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Procesando...
                  </>
                ) : (
                  <>
                    Confirmar pedido - {formatCurrency(finalTotal)}
                  </>
                )}
              </button>

              <div className="text-center">
                <small className="text-muted">
                  Se enviará confirmación por WhatsApp
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;