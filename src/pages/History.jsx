import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/store';
import { formatCurrency } from '../utils/format';
import Toast from '../components/Toast';
import SpinnerButton from '../components/SpinnerButton';

const History = () => {
  const { user, orders = [], fetchOrders, updateUserPhone } = useStore();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      setNewPhone(user.phone || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const validatePhone = (p) => /^\+?\d{10,15}$/.test(p);

  const handleUpdatePhone = async () => {
    if (!validatePhone(newPhone)) {
      setToast({ type: 'danger', text: 'Número de celular inválido (10-15 dígitos).' });
      return;
    }
    try {
      await updateUserPhone(user.uid, newPhone);
      setToast({ type: 'success', text: 'Número de celular actualizado.' });
      setIsEditingPhone(false);
    } catch {
      setToast({ type: 'danger', text: 'Error al actualizar el celular.' });
    }
  };

  if (!user) return <div className="container my-4 alert alert-danger">Por favor, inicia sesión para ver tu historial de compras.</div>;

  const userOrders = orders.filter(order => order.userId === user.uid);

  return (
    <div className="container-fluid admin-layout">
      <div className="row">
        <div className="col-12 p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <h1 className="h4 mb-3 mb-md-0">Historial de Compras</h1>
            <div className="d-flex align-items-center">
              <div className="position-relative">
                <i className="bi bi-bell fs-5 text-muted"></i>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-3">
              <h6 className="card-subtitle mb-2 text-muted">PERFIL</h6>
              <p className="text-muted small mb-0">Email: {user?.email || '—'}</p>
              <div className="d-flex align-items-center mt-2">
                <p className="text-muted small mb-0 me-2">Celular: </p>
                {isEditingPhone ? (
                  <div className="d-flex align-items-center">
                    <input
                      type="tel"
                      className="form-control form-control-sm me-2"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Ej. +1234567890"
                      style={{ width: '150px' }}
                    />
                    <SpinnerButton
                      onClick={handleUpdatePhone}
                      className="btn btn-sm btn-success me-2"
                      loading={false}
                    >
                      Guardar
                    </SpinnerButton>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setNewPhone(user.phone || '');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="text-muted small">{user?.phone || 'No registrado'}</span>
                    <button
                      className="btn btn-sm btn-link p-0 ms-2"
                      onClick={() => setIsEditingPhone(true)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-md-4">
              <h5 className="card-title mb-4">Tus Compras</h5>
              <div className="row g-3">
                {userOrders.length === 0 ? (
                  <div className="col-12 text-muted">No tienes compras registradas. ¡Explora la tienda para comenzar!</div>
                ) : (
                  userOrders.map(o => (
                    <div key={o.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <img
                          src={o.items?.[0]?.image || 'https://via.placeholder.com/80x120?text=Pedido'}
                          className="card-img-top"
                          alt={`Imagen del pedido #${o.id.slice(-4)}`}
                          style={{ height: '120px', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        <div className="card-body p-2">
                          <p className="card-text mb-1 fw-bold">{formatCurrency(o.total)}</p>
                          <p className="card-text mb-0 text-muted">Pedido #{o.id.slice(-4)}</p>
                          <p className="card-text small text-muted">Usuario: {o.userEmail || '—'}</p>
                          <p className="card-text small text-muted">Fecha: {o.createdAt?.toDate().toLocaleDateString() || '—'}</p>
                          <p className="card-text small text-muted mt-1">Estado: {o.status || 'pending'}</p>
                          {o.items?.length > 0 && (
                            <details className="mt-2">
                              <summary className="small">Ver items ({o.items.length})</summary>
                              <ul className="small mt-2 ps-3">
                                {o.items.map((it, idx) => (
                                  <li key={idx}>
                                    {it.name} x{it.quantity} — {formatCurrency(it.price)}
                                    {it.discount > 0 && (
                                      <span className="text-success ms-2">
                                        (Original: {formatCurrency(it.originalPrice)}, -{(it.discount * 100).toFixed(0)}%)
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/" className="btn btn-link p-0 mt-3 d-block">Volver a la tienda</Link>
            </div>
          </div>
          <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;