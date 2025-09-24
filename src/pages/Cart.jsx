import useStore from '../store/store';
import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import Toast from '../components/Toast';
import CartItem from '../components/CartItem';
import '../styles/Cart.css';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, coupon, applyCoupon, user, createOrder, calculateFinalPrice } = useStore();
  const [processing, setProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState(coupon || '');
  const [msg, setMsg] = useState(null);

  if (!user) return <div className="container my-4 alert alert-danger">Debes iniciar sesión para ver el carrito.</div>;

  const subtotal = cart.reduce((sum, item) => sum + (calculateFinalPrice(item.price, item.discount) * (item.quantity || 0)), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMsg({ type: 'danger', text: 'El carrito está vacío.' });
      return;
    }
    if (!window.confirm('¿Confirmar tu pedido? Se enviará una notificación por WhatsApp.')) return;
    setProcessing(true);
    try {
      await createOrder({ userId: user.uid, items: cart, total: subtotal });
      setMsg({ type: 'success', text: 'Pedido procesado. Revisa la notificación en WhatsApp.' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: err.message || 'Error al procesar pedido.' });
    } finally {
      setProcessing(false);
    }
  };

  const tryApplyCoupon = () => {
    const ok = applyCoupon(couponInput);
    setMsg(ok ? { type: 'success', text: 'Cupón aplicado.' } : { type: 'danger', text: 'Cupón inválido o expirado.' });
  };

  return (
    <div className="container my-4 cart-container">
      <h1 className="mb-4 text-dark">Mi carrito</h1>
      <div className="toast-container position-fixed top-0 end-0 p-3">
        {msg && <Toast {...msg} onClose={() => setMsg(null)} />}
      </div>
      {cart.length === 0 ? (
        <p className="text-muted">El carrito está vacío.</p>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-8">
            {cart.map(item => (
              <CartItem key={item.id} item={item} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
            ))}
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3 shadow-sm">
              <h4 className="text-dark">Resumen</h4>
              <button className="btn btn-whatsapp w-100 mb-3" onClick={handleCheckout} disabled={processing || cart.length === 0}>
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Procesando...
                  </>
                ) : 'Continuar con la compra'}
              </button>
              <p className="text-muted">{totalItems} producto{totalItems !== 1 ? 's' : ''} &nbsp; {formatCurrency(subtotal)} COP</p>
              <h5 className="text-dark">Total: {formatCurrency(subtotal)} COP</h5>
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="¿Tienes un código de descuento?" 
                  value={couponInput} 
                  onChange={(e) => setCouponInput(e.target.value)} 
                />
                <button className="btn btn-outline-dark" onClick={tryApplyCoupon}>Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;