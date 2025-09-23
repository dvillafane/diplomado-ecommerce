import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import useStore from '../store/store';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/format';
import SpinnerButton from '../components/SpinnerButton';

const Admin = () => {
  const {
    user,
    products = [],
    orders = [],
    fetchProducts,
    fetchOrders,
    updateProduct,
    createOrder,
    updateOrder,
    deleteOrder,
    calculateFinalPrice, // Added to use for discounted prices
  } = useStore();

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    description: '',
    discount: 0,
    sales: 0,
    stock: 0,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [newOrder, setNewOrder] = useState({ userId: '', items: [], total: 0 });
  const [editingOrder, setEditingOrder] = useState(null);
  const [messageToast, setMessageToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, onConfirm: () => {}, title: '', text: '' });
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [users, setUsers] = useState([]);
  const itemsPerPage = 10;
  const categories = ['Electrónica', 'Ropa', 'Hogar', 'Accesorios', 'Otros'];

  // Fetch users for the order form
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
          phone: doc.data().phone || '',
        }));
        setUsers(userList);
      } catch {
        setMessageToast({ type: 'danger', text: 'Error cargando usuarios.' });
      }
    };
    fetchUsers();
    fetchProducts();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || !user.isAdmin) return <div className="container my-4 alert alert-danger">Acceso denegado.</div>;

  const addOrUpdateProduct = async () => {
    if (!newProduct.name || newProduct.price === '') {
      setMessageToast({ type: 'danger', text: 'Nombre y precio son obligatorios.' });
      return;
    }
    const price = parseFloat(String(newProduct.price).replace(',', '.'));
    const discount = parseFloat(newProduct.discount) || 0;
    const stock = parseInt(newProduct.stock) || 0;
    if (isNaN(price) || price <= 0) {
      setMessageToast({ type: 'danger', text: 'Precio inválido (debe ser positivo).' });
      return;
    }
    if (discount < 0 || discount > 1) {
      setMessageToast({ type: 'danger', text: 'Descuento debe ser entre 0 y 1 (ej. 0.1 para 10%).' });
      return;
    }
    if (stock < 0) {
      setMessageToast({ type: 'danger', text: 'Stock no puede ser negativo.' });
      return;
    }
    setLoading(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, { ...newProduct, price, discount, stock });
        setEditingProduct(null);
        setMessageToast({ type: 'success', text: 'Producto actualizado correctamente.' });
      } else {
        await addDoc(collection(db, 'products'), { ...newProduct, price, discount, stock, sales: 0 });
        setMessageToast({ type: 'success', text: 'Producto agregado correctamente.' });
      }
      await fetchProducts();
      setNewProduct({ name: '', price: '', category: '', image: '', description: '', discount: 0, sales: 0, stock: 0 });
    } catch (err) {
      setMessageToast({ type: 'danger', text: err.message || 'Error al guardar producto.' });
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateOrder = async () => {
    if (!newOrder.userId || newOrder.items.length === 0) {
      setMessageToast({ type: 'danger', text: 'Usuario y al menos un producto son obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        userId: newOrder.userId,
        items: newOrder.items,
        total: newOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0), // Use discounted price
        createdAt: new Date(),
        status: 'pending',
      };
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        setEditingOrder(null);
        setMessageToast({ type: 'success', text: 'Pedido actualizado correctamente.' });
      } else {
        await createOrder(orderData);
        setMessageToast({ type: 'success', text: 'Pedido creado correctamente.' });
      }
      await fetchOrders();
      setNewOrder({ userId: '', items: [], total: 0 });
    } catch (err) {
      setMessageToast({ type: 'danger', text: err.message || 'Error al guardar pedido.' });
    } finally {
      setLoading(false);
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product, discount: product.discount || 0, sales: product.sales || 0, stock: product.stock || 0 });
  };

  const startEditOrder = (order) => {
    setEditingOrder(order);
    setNewOrder({ userId: order.userId, items: order.items, total: order.total });
  };

  const confirmAction = (actionType, id = null) => {
    let title = '';
    let text = '';
    let onConfirm = () => {};
    if (actionType === 'deleteProduct' || actionType === 'deleteOrder') {
      const type = actionType === 'deleteProduct' ? 'product' : 'order';
      title = `Eliminar ${type === 'product' ? 'producto' : 'pedido'}`;
      text = `¿Estás seguro de eliminar este ${type === 'product' ? 'producto' : 'pedido'}?`;
      onConfirm = () => deleteItem(id, type);
    } else if (actionType === 'addOrUpdateProduct') {
      title = editingProduct ? 'Actualizar Producto' : 'Agregar Producto';
      text = `¿Estás seguro de ${editingProduct ? 'actualizar' : 'agregar'} este producto?`;
      onConfirm = addOrUpdateProduct;
    } else if (actionType === 'addOrUpdateOrder') {
      title = editingOrder ? 'Actualizar Pedido' : 'Crear Pedido';
      text = `¿Estás seguro de ${editingOrder ? 'actualizar' : 'crear'} este pedido?`;
      onConfirm = addOrUpdateOrder;
    }
    setConfirm({ show: true, onConfirm, title, text });
  };

  const deleteItem = async (id, type) => {
    try {
      if (type === 'product') {
        await deleteDoc(doc(db, 'products', id));
        await fetchProducts();
        setMessageToast({ type: 'success', text: 'Producto eliminado.' });
      } else if (type === 'order') {
        await deleteOrder(id);
        setMessageToast({ type: 'success', text: 'Pedido eliminado.' });
      }
    } catch {
      setMessageToast({ type: 'danger', text: 'Error al eliminar.' });
    }
  };

  const cycleOrderStatus = async (order) => {
    const statuses = ['pending', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(order.status || 'pending');
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    try {
      await updateOrder(order.id, { status: nextStatus });
      setMessageToast({ type: 'success', text: `Pedido actualizado a "${nextStatus}".` });
    } catch {
      setMessageToast({ type: 'danger', text: 'Error al actualizar pedido.' });
    }
  };

  const addItemToOrder = (product) => {
    const existingItem = newOrder.items.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setMessageToast({ type: 'danger', text: `No hay suficiente stock para ${product.name}.` });
        return;
      }
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      if (product.stock <= 0) {
        setMessageToast({ type: 'danger', text: `No hay stock disponible para ${product.name}.` });
        return;
      }
      const discountedPrice = calculateFinalPrice(product.price, product.discount); // Use discounted price
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { 
          id: product.id, 
          name: product.name, 
          price: discountedPrice, // Store discounted price
          originalPrice: product.price, // Store original price
          discount: product.discount || 0, // Store discount
          quantity: 1 
        }],
      });
    }
  };

  const removeItemFromOrder = (itemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.id !== itemId),
    });
  };

  const updateItemQuantity = (itemId, quantity) => {
    const product = products.find(p => p.id === itemId);
    if (quantity <= 0 || quantity > product.stock) {
      setMessageToast({ type: 'danger', text: `Cantidad inválida para ${product.name}.` });
      return;
    }
    setNewOrder({
      ...newOrder,
      items: newOrder.items.map(item =>
        item.id === itemId ? { ...item, quantity: parseInt(quantity) } : item
      ),
    });
  };

  const paginatedProducts = products.slice(productPage * itemsPerPage, (productPage + 1) * itemsPerPage);
  const paginatedOrders = orders.slice(orderPage * itemsPerPage, (orderPage + 1) * itemsPerPage);

  return (
    <div className="container-fluid admin-layout">
      <div className="row">
        <div className="col-12 p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <h1 className="h4 mb-3 mb-md-0">Panel de Administración</h1>
            <div className="d-flex align-items-center">
              <div className="position-relative">
                <i className="bi bi-bell fs-5 text-muted"></i>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3 p-md-4">
                  <h5 className="card-title mb-4">{editingProduct ? 'Editar producto' : 'Agregar nuevo producto'}</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Nombre del producto</label>
                      <input
                        className="form-control"
                        placeholder="Ej: Camiseta Nike"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Precio</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                      </div>
                      <div className="form-text">Precio en pesos colombianos</div>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Descuento (%)</label>
                      <input
                        className="form-control"
                        placeholder="Ej: 10"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={newProduct.discount * 100}
                        onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value / 100 })}
                      />
                      <div className="form-text">Entre 0 y 100</div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      >
                        <option value="">Seleccione categoría</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label">Stock disponible</label>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Imagen del producto (URL)</label>
                      <input
                        className="form-control"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      />
                      {newProduct.image && (
                        <div className="mt-2">
                          <img src={newProduct.image} alt="Vista previa" className="img-thumbnail w-100" style={{ maxHeight: '150px', objectFit: 'contain' }} loading="lazy" />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        placeholder="Breve descripción del producto..."
                        rows="3"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>
                    <div className="col-12 d-flex flex-column flex-md-row gap-2">
                      <SpinnerButton loading={loading} onClick={() => confirmAction('addOrUpdateProduct')} className="btn btn-success w-100 w-md-auto">
                        {loading ? 'Guardando...' : (editingProduct ? 'Actualizar producto' : 'Agregar producto')}
                      </SpinnerButton>
                      {editingProduct && (
                        <button
                          className="btn btn-outline-secondary w-100 w-md-auto"
                          onClick={() => {
                            setEditingProduct(null);
                            setNewProduct({ name: '', price: '', category: '', image: '', description: '', discount: 0, sales: 0, stock: 0 });
                          }}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3 p-md-4">
                  <h5 className="card-title mb-4">{editingOrder ? 'Editar pedido' : 'Crear nuevo pedido'}</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Usuario</label>
                      <select
                        className="form-select"
                        value={newOrder.userId}
                        onChange={(e) => setNewOrder({ ...newOrder, userId: e.target.value })}
                      >
                        <option value="">Seleccione usuario</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Productos</label>
                      <select
                        className="form-select"
                        onChange={(e) => {
                          const product = products.find(p => p.id === e.target.value);
                          if (product) addItemToOrder(product);
                        }}
                      >
                        <option value="">Seleccione producto</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <h6>Items seleccionados</h6>
                      {newOrder.items.length === 0 ? (
                        <p className="text-muted">No hay productos en el pedido.</p>
                      ) : (
                        <ul className="list-group">
                          {newOrder.items.map(item => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                              <span className="flex-grow-1">{item.name} x <input
                                type="number"
                                min="1"
                                max={products.find(p => p.id === item.id)?.stock || 1}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                style={{ width: '60px' }}
                              /></span>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => removeItemFromOrder(item.id)}
                              >
                                Eliminar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="col-12 d-flex flex-column flex-md-row gap-2">
                      <SpinnerButton loading={loading} onClick={() => confirmAction('addOrUpdateOrder')} className="btn btn-success w-100 w-md-auto">
                        {loading ? 'Guardando...' : (editingOrder ? 'Actualizar pedido' : 'Crear pedido')}
                      </SpinnerButton>
                      {editingOrder && (
                        <button
                          className="btn btn-outline-secondary w-100 w-md-auto"
                          onClick={() => {
                            setEditingOrder(null);
                            setNewOrder({ userId: '', items: [], total: 0 });
                          }}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                  <h6 className="card-subtitle mb-2 text-muted">Lista de productos</h6>
                  <div className="list-group mt-3">
                    {paginatedProducts.map(p => (
                      <div key={p.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                        <div>
                          <strong>{p.name}</strong>
                          <div className="text-muted small d-flex flex-wrap gap-1">
                            {formatCurrency(p.price)} • {p.category || '—'} • Desc: {(p.discount * 100).toFixed(0)}% • Ventas: {p.sales || 0} • <strong>Unidades: {p.stock || 0}</strong>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-2 mt-md-0">
                          <button className="btn btn-sm btn-primary" onClick={() => startEditProduct(p)}>Editar</button>
                          <button className="btn btn-sm btn-danger" onClick={() => confirmAction('deleteProduct', p.id)}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 d-flex justify-content-between">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setProductPage(p => Math.max(0, p - 1))}
                      disabled={productPage === 0}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setProductPage(p => p + 1)}
                      disabled={(productPage + 1) * itemsPerPage >= products.length}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <h6 className="card-subtitle mb-2 text-muted">Pedidos</h6>
                  <div className="list-group mt-3">
                    {paginatedOrders.map(o => (
                      <div key={o.id} className="list-group-item">
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                          <div>Pedido #{o.id} • Status: {o.status || 'pending'}</div>
                          <div><strong>{formatCurrency(o.total)}</strong></div>
                        </div>
                        <div className="small text-muted">Usuario: {o.userEmail || '—'}</div>
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
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => cycleOrderStatus(o)}>Cambiar status</button>
                          <button className="btn btn-sm btn-primary" onClick={() => startEditOrder(o)}>Editar</button>
                          <button className="btn btn-sm btn-danger" onClick={() => confirmAction('deleteOrder', o.id)}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 d-flex justify-content-between">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setOrderPage(p => Math.max(0, p - 1))}
                      disabled={orderPage === 0}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setOrderPage(p => p + 1)}
                      disabled={(orderPage + 1) * itemsPerPage >= orders.length}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ConfirmModal
            show={confirm.show}
            onCancel={() => setConfirm({ show: false, onConfirm: () => {}, title: '', text: '' })}
            onConfirm={() => {
              confirm.onConfirm();
              setConfirm({ show: false, onConfirm: () => {}, title: '', text: '' });
            }}
            title={confirm.title}
            text={confirm.text}
          />
          <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
            {messageToast && <Toast {...messageToast} onClose={() => setMessageToast(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;