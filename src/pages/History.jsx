// src/pages/History.jsx
// Componente funcional que muestra el historial de compras del usuario y permite actualizar el número de celular
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/store';
import { formatCurrency } from '../utils/format';
import Toast from '../components/Toast';
import SpinnerButton from '../components/SpinnerButton';
import { ROUTES } from '../utils/constants';

// Componente principal para la página de historial
const History = () => {
  // Obtiene datos y funciones del store global
  const { user, orders = [], fetchOrders, updateUserPhone } = useStore();
  // Estados para gestionar la edición del número de celular y notificaciones
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [toast, setToast] = useState(null);

  // Efecto para cargar pedidos y actualizar el número de celular cuando cambia el usuario
  useEffect(() => {
    if (user) {
      fetchOrders(); // Carga los pedidos del usuario
      setNewPhone(user.phone || ''); // Inicializa el campo de celular
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Función para validar el formato del número de celular
  const validatePhone = (p) => /^\+?\d{10,15}$/.test(p);

  // Función para actualizar el número de celular del usuario
  const handleUpdatePhone = async () => {
    if (!validatePhone(newPhone)) {
      setToast({ type: 'danger', text: 'Número de celular inválido (10-15 dígitos).' });
      return;
    }
    try {
      await updateUserPhone(user.uid, newPhone); // Actualiza el número en Firestore
      setToast({ type: 'success', text: 'Número de celular actualizado.' });
      setIsEditingPhone(false); // Sale del modo edición
    } catch {
      setToast({ type: 'danger', text: 'Error al actualizar el celular.' });
    }
  };

  // Verifica si el usuario está autenticado
  if (!user) return <div className="container my-4 alert alert-danger">Por favor, inicia sesión para ver tu historial de compras.</div>;

  // Filtra los pedidos del usuario actual
  const userOrders = orders.filter(order => order.userId === user.uid);

  // Renderiza la interfaz del historial de compras
  return (
    <div className="container-fluid admin-layout">
      <div className="row">
        <div className="col-12 p-3 p-md-4">
          {/* Encabezado con título y ícono de notificación */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <h1 className="h4 mb-3 mb-md-0">Historial de Compras</h1>
            <div className="d-flex align-items-center">
              <div className="position-relative">
                <i className="bi bi-bell fs-5 text-muted"></i>
              </div>
            </div>
          </div>

          {/* Sección de perfil del usuario */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-3">
              <h6 className="card-subtitle mb-2 text-muted">PERFIL</h6>
              <p className="text-muted small mb-0">Email: {user?.email || '—'}</p>
              <div className="d-flex align-items-center mt-2">
                <p className="text-muted small mb-0 me-2">Celular: </p>
                {isEditingPhone ? (
                  // Formulario para editar el número de celular
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
                  // Muestra el número de celular con opción de editar
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

          {/* Lista de pedidos del usuario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-md-4">
              <h5 className="card-title mb-4">Tus Compras</h5>
              <div className="row g-3">
                {userOrders.length === 0 ? (
                  // Mensaje si no hay pedidos
                  <div className="col-12 text-muted">No tienes compras registradas. ¡Explora la tienda para comenzar!</div>
                ) : (
                  // Renderiza cada pedido como una tarjeta
                  userOrders.map(o => (
                    <div key={o.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <img
                          src={o.items?.[0]?.image || '/placeholder.png'} // Cambiado a /placeholder.png
                          className="card-img-top"
                          alt={`Imagen del pedido #${o.id.slice(-4)}`}
                          style={{ height: '120px', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        <div className="card-body p-2">
                          <p className="card-text mb-1 fw-bold">{formatCurrency(o.total)}</p>
                          <p className="card-text mb-0 text-muted">Pedido #{o.id.slice(-6)}</p>
                          <p className="card-text small text-primary fw-bold">Cliente: {user.email}</p>
                          <p className="card-text small text-muted">Fecha: {o.createdAt?.toDate?.() ? o.createdAt.toDate().toLocaleDateString() : 'Fecha no disponible'}</p>
                          <p className="card-text small text-muted mt-1">Estado: 
                            <span className={`ms-1 badge ${
                              o.status === 'delivered' ? 'bg-success' : 
                              o.status === 'shipped' ? 'bg-warning' : 
                              'bg-secondary'
                            }`}>
                              {o.status === 'delivered' ? 'Entregado' : 
                               o.status === 'shipped' ? 'Enviado' : 
                               o.status === 'pending' ? 'Pendiente' : 
                               o.status || 'Pendiente'}
                            </span>
                          </p>
                          {o.items?.length > 0 && (
                            // Detalles desplegables de los ítems del pedido
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
              <Link to={ROUTES.HOME} className="btn btn-link p-0 mt-3 d-block">Volver a la tienda</Link>
            </div>
          </div>
          {/* Contenedor para notificaciones tipo toast */}
          <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;