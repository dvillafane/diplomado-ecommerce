// src/pages/Admin.jsx
// Componente principal para el panel de administración, gestiona productos, pedidos y códigos promocionales
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import useStore from '../store/store';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/format';
import SpinnerButton from '../components/SpinnerButton';
import { CATEGORIES, ORDER_STATUSES, ITEMS_PER_PAGE } from '../utils/constants';

// Componente funcional para la página de administración
const Admin = () => {
  // Obtiene datos y funciones del store global
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
    calculateFinalPrice,
  } = useStore();

  // Estados para gestionar formularios y datos
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', image: '', description: '', discount: 0, sales: 0, stock: 0,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [newOrder, setNewOrder] = useState({ userId: '', items: [], total: 0 });
  const [editingOrder, setEditingOrder] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '', discount: '', maxUses: '', expiresAt: '', description: ''
  });
  const [editingPromoCode, setEditingPromoCode] = useState(null);
  const [messageToast, setMessageToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, onConfirm: () => {}, title: '', text: '' });
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [promoPage, setPromoPage] = useState(0);
  const [users, setUsers] = useState([]);

  // Efecto para cargar datos iniciales (usuarios y códigos promocionales)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtiene lista de usuarios desde Firestore
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
          phone: doc.data().phone || '',
        }));
        setUsers(userList);
        // Carga códigos promocionales
        await fetchPromoCodes();
      } catch {
        setMessageToast({ type: 'danger', text: 'Error cargando datos.' });
      }
    };
    fetchData();
    fetchProducts(); // Carga productos
    fetchOrders(); // Carga pedidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para obtener códigos promocionales desde Firestore
  const fetchPromoCodes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'promoCodes'));
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null
      }));
      setPromoCodes(codes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setMessageToast({ type: 'danger', text: 'Error cargando códigos promocionales.' });
    }
  };

  // Función para agregar o actualizar códigos promocionales
  const addOrUpdatePromoCode = async () => {
    // Validaciones de campos requeridos
    if (!newPromoCode.code || !newPromoCode.discount || !newPromoCode.maxUses || !newPromoCode.expiresAt) {
      setMessageToast({ type: 'danger', text: 'Todos los campos son obligatorios.' });
      return;
    }
    const discount = parseFloat(newPromoCode.discount);
    const maxUses = parseInt(newPromoCode.maxUses);
    const expiresAt = new Date(newPromoCode.expiresAt);
    if (isNaN(discount) || discount <= 0 || discount > 1) {
      setMessageToast({ type: 'danger', text: 'El descuento debe ser entre 0.01 y 1 (ej. 0.15 para 15%).' });
      return;
    }
    if (isNaN(maxUses) || maxUses <= 0) {
      setMessageToast({ type: 'danger', text: 'Los usos máximos deben ser un número positivo.' });
      return;
    }
    if (expiresAt <= new Date()) {
      setMessageToast({ type: 'danger', text: 'La fecha de expiración debe ser futura.' });
      return;
    }
    setLoading(true);
    try {
      const promoData = {
        code: newPromoCode.code.toUpperCase(),
        discount,
        maxUses,
        uses: editingPromoCode ? editingPromoCode.uses || 0 : 0,
        expiresAt,
        description: newPromoCode.description || '',
        createdAt: editingPromoCode ? editingPromoCode.createdAt : new Date(),
        isActive: true
      };
      if (editingPromoCode) {
        await updateDoc(doc(db, 'promoCodes', editingPromoCode.id), promoData);
        setEditingPromoCode(null);
        setMessageToast({ type: 'success', text: 'Código promocional actualizado correctamente.' });
      } else {
        // Verifica si el código ya existe
        const existingCode = promoCodes.find(code => code.code === promoData.code);
        if (existingCode) {
          setMessageToast({ type: 'danger', text: 'Ya existe un código con ese nombre.' });
          setLoading(false);
          return;
        }
        await addDoc(collection(db, 'promoCodes'), promoData);
        setMessageToast({ type: 'success', text: 'Código promocional creado correctamente.' });
      }
      await fetchPromoCodes();
      setNewPromoCode({ code: '', discount: '', maxUses: '', expiresAt: '', description: '' });
    } catch (err) {
      console.error('Error saving promo code:', err);
      setMessageToast({ type: 'danger', text: err.message || 'Error al guardar código promocional.' });
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar la edición de un código promocional
  const startEditPromoCode = (promoCode) => {
    setEditingPromoCode(promoCode);
    setNewPromoCode({
      code: promoCode.code,
      discount: promoCode.discount.toString(),
      maxUses: promoCode.maxUses.toString(),
      expiresAt: promoCode.expiresAt ? promoCode.expiresAt.toISOString().split('T')[0] : '',
      description: promoCode.description || ''
    });
  };

  // Función para eliminar un código promocional
  const deletePromoCode = async (id) => {
    try {
      await deleteDoc(doc(db, 'promoCodes', id));
      await fetchPromoCodes();
      setMessageToast({ type: 'success', text: 'Código promocional eliminado.' });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      setMessageToast({ type: 'danger', text: 'Error al eliminar código promocional.' });
    }
  };

  // Función para activar o desactivar un código promocional
  const togglePromoCodeStatus = async (promoCode) => {
    try {
      await updateDoc(doc(db, 'promoCodes', promoCode.id), {
        isActive: !promoCode.isActive
      });
      await fetchPromoCodes();
      setMessageToast({
        type: 'success',
        text: `Código promocional ${promoCode.isActive ? 'desactivado' : 'activado'}.`
      });
    } catch (error) {
      console.error('Error toggling promo code status:', error);
      setMessageToast({ type: 'danger', text: 'Error al cambiar estado del código.' });
    }
  };

  // Verifica si el usuario es administrador
  if (!user || !user.isAdmin) return <div className="container my-4 alert alert-danger">Acceso denegado.</div>;

  // Función para agregar o actualizar productos
  const addOrUpdateProduct = async () => {
    // Validaciones de campos requeridos
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

  // Función para agregar o actualizar pedidos
  const addOrUpdateOrder = async () => {
    // Validaciones de campos requeridos
    if (!newOrder.userId || newOrder.items.length === 0) {
      setMessageToast({ type: 'danger', text: 'Usuario y al menos un producto son obligatorios.' });
      return;
    }
    // Verifica stock disponible
    for (const item of newOrder.items) {
      const product = products.find(p => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        setMessageToast({ type: 'danger', text: `Stock insuficiente para ${item.name}. Disponible: ${product?.stock || 0}.` });
        return;
      }
    }
    setLoading(true);
    try {
      const selectedUser = users.find(u => u.id === newOrder.userId);
      const orderData = {
        userId: newOrder.userId,
        userEmail: selectedUser ? selectedUser.email : 'Email no disponible',
        items: newOrder.items,
        total: newOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        createdAt: new Date(),
        status: 'pending',
        statusHistory: editingOrder ? (editingOrder.statusHistory || []) : [{ status: 'pending', date: new Date() }],
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

  // Función para iniciar la edición de un producto
  const startEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product, discount: product.discount || 0, sales: product.sales || 0, stock: product.stock || 0 });
  };

  // Función para iniciar la edición de un pedido
  const startEditOrder = (order) => {
    setEditingOrder(order);
    setNewOrder({ userId: order.userId, items: order.items, total: order.total });
  };

  // Función para manejar acciones con confirmación
  const confirmAction = (actionType, id = null) => {
    let title = '';
    let text = '';
    let onConfirm = () => {};
    if (actionType === 'deleteProduct' || actionType === 'deleteOrder' || actionType === 'deletePromoCode') {
      const type = actionType === 'deleteProduct' ? 'product' : actionType === 'deleteOrder' ? 'order' : 'promoCode';
      title = `Eliminar ${type === 'product' ? 'producto' : type === 'order' ? 'pedido' : 'código promocional'}`;
      text = `¿Estás seguro de eliminar este ${type === 'product' ? 'producto' : type === 'order' ? 'pedido' : 'código promocional'}?`;
      onConfirm = () => deleteItem(id, type);
    } else if (actionType === 'addOrUpdateProduct') {
      title = editingProduct ? 'Actualizar Producto' : 'Agregar Producto';
      text = `¿Estás seguro de ${editingProduct ? 'actualizar' : 'agregar'} este producto?`;
      onConfirm = addOrUpdateProduct;
    } else if (actionType === 'addOrUpdateOrder') {
      title = editingOrder ? 'Actualizar Pedido' : 'Crear Pedido';
      text = `¿Estás seguro de ${editingOrder ? 'actualizar' : 'crear'} este pedido?`;
      onConfirm = addOrUpdateOrder;
    } else if (actionType === 'addOrUpdatePromoCode') {
      title = editingPromoCode ? 'Actualizar Código' : 'Crear Código';
      text = `¿Estás seguro de ${editingPromoCode ? 'actualizar' : 'crear'} este código promocional?`;
      onConfirm = addOrUpdatePromoCode;
    }
    setConfirm({ show: true, onConfirm, title, text });
  };

  // Función para eliminar elementos (producto, pedido o código promocional)
  const deleteItem = async (id, type) => {
    try {
      if (type === 'product') {
        await deleteDoc(doc(db, 'products', id));
        await fetchProducts();
        setMessageToast({ type: 'success', text: 'Producto eliminado.' });
      } else if (type === 'order') {
        await deleteOrder(id);
        setMessageToast({ type: 'success', text: 'Pedido eliminado.' });
      } else if (type === 'promoCode') {
        await deletePromoCode(id);
      }
    } catch {
      setMessageToast({ type: 'danger', text: 'Error al eliminar.' });
    }
  };

  // Función para cambiar el estado de un pedido
  const cycleOrderStatus = async (order) => {
    const statuses = ORDER_STATUSES;
    const currentIndex = statuses.indexOf(order.status || 'pending');
    if (currentIndex === statuses.length - 1) {
      setMessageToast({ type: 'warning', text: 'El pedido ya está entregado.' });
      return;
    }
    const nextStatus = statuses[currentIndex + 1];
    try {
      const selectedUser = users.find(u => u.id === order.userId);
      await updateOrder(order.id, {
        status: nextStatus,
        userEmail: selectedUser ? selectedUser.email : order.userEmail || 'Email no disponible',
        statusHistory: [...(order.statusHistory || []), { status: nextStatus, date: new Date() }],
      });
      setMessageToast({ type: 'success', text: `Pedido actualizado a "${nextStatus}".` });
      await fetchOrders();
    } catch (error) {
      console.error('Error en cycleOrderStatus:', error);
      setMessageToast({ type: 'danger', text: `Error al actualizar pedido: ${error.message}` });
    }
  };

  // Función para agregar un producto al pedido
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
      const discountedPrice = calculateFinalPrice(product.price, product.discount);
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, {
          id: product.id,
          name: product.name,
          price: discountedPrice,
          originalPrice: product.price,
          discount: product.discount || 0,
          quantity: 1
        }],
      });
    }
  };

  // Función para eliminar un producto del pedido
  const removeItemFromOrder = (itemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.id !== itemId),
    });
  };

  // Función para actualizar la cantidad de un producto en el pedido
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

  // Paginación para productos, pedidos y códigos promocionales
  const paginatedProducts = products.slice(productPage * ITEMS_PER_PAGE, (productPage + 1) * ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice(orderPage * ITEMS_PER_PAGE, (orderPage + 1) * ITEMS_PER_PAGE);
  const paginatedPromoCodes = promoCodes.slice(promoPage * ITEMS_PER_PAGE, (promoPage + 1) * ITEMS_PER_PAGE);

  // Renderiza la interfaz del panel de administración
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
          {/* Sección para gestionar códigos promocionales */}
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                  <h5 className="card-title mb-4">{editingPromoCode ? 'Editar código promocional' : 'Crear nuevo código promocional'}</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-3">
                      <label className="form-label">Código</label>
                      <input
                        className="form-control"
                        placeholder="DESCUENTO15"
                        value={newPromoCode.code}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label">Descuento (%)</label>
                      <input
                        className="form-control"
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        placeholder="15"
                        value={newPromoCode.discount ? (parseFloat(newPromoCode.discount) * 100).toString() : ''}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, discount: (e.target.value / 100).toString() })}
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label">Usos máximos</label>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        placeholder="100"
                        value={newPromoCode.maxUses}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, maxUses: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Fecha de expiración</label>
                      <input
                        className="form-control"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={newPromoCode.expiresAt}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-2 d-flex align-items-end">
                      <SpinnerButton
                        loading={loading}
                        onClick={() => confirmAction('addOrUpdatePromoCode')}
                        className="btn btn-success w-100"
                      >
                        {editingPromoCode ? 'Actualizar' : 'Crear'}
                      </SpinnerButton>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Descripción (opcional)</label>
                      <input
                        className="form-control"
                        placeholder="Descuento especial de primavera"
                        value={newPromoCode.description}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, description: e.target.value })}
                      />
                    </div>
                    {editingPromoCode && (
                      <div className="col-12">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingPromoCode(null);
                            setNewPromoCode({ code: '', discount: '', maxUses: '', expiresAt: '', description: '' });
                          }}
                        >
                          Cancelar edición
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Lista de códigos promocionales */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <h6 className="card-subtitle mb-2 text-muted">Códigos promocionales</h6>
                  <div className="list-group mt-3">
                    {paginatedPromoCodes.map(promo => (
                      <div key={promo.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                        <div>
                          <strong className={`${!promo.isActive ? 'text-muted' : ''}`}>
                            {promo.code} {!promo.isActive && '(INACTIVO)'}
                          </strong>
                          <div className="text-muted small d-flex flex-wrap gap-2">
                            <span>Desc: {(promo.discount * 100).toFixed(0)}%</span>
                            <span>Usos: {promo.uses || 0}/{promo.maxUses}</span>
                            <span>Expira: {promo.expiresAt ? promo.expiresAt.toLocaleDateString() : 'Sin fecha'}</span>
                            {promo.description && <span>"{promo.description}"</span>}
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-2 mt-md-0">
                          <button
                            className={`btn btn-sm ${promo.isActive ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => togglePromoCodeStatus(promo)}
                          >
                            {promo.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => startEditPromoCode(promo)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => confirmAction('deletePromoCode', promo.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 d-flex justify-content-between">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setPromoPage(p => Math.max(0, p - 1))}
                      disabled={promoPage === 0}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setPromoPage(p => p + 1)}
                      disabled={(promoPage + 1) * ITEMS_PER_PAGE >= promoCodes.length}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              {/* Sección para gestionar productos */}
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
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
              {/* Sección para gestionar pedidos */}
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
              {/* Lista de productos */}
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
                      disabled={(productPage + 1) * ITEMS_PER_PAGE >= products.length}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
              {/* Lista de pedidos */}
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <h6 className="card-subtitle mb-2 text-muted">Pedidos</h6>
                  <div className="list-group mt-3">
                    {paginatedOrders.map(o => {
                      const user = users.find(u => u.id === o.userId);
                      const userEmail = user ? user.email : o.userEmail || 'Email no disponible';
                      return (
                        <div key={o.id} className="list-group-item">
                          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                            <div>
                              <strong>Pedido #{o.id.slice(-6)}</strong>
                              <div className="small text-muted">Estado: {o.status || 'pending'}</div>
                              <div className="small text-primary fw-bold">Cliente: {userEmail}</div>
                              {o.userPhone && (
                                <div className="small text-muted">Tel: {o.userPhone}</div>
                              )}
                            </div>
                            <div className="text-end">
                              <strong>{formatCurrency(o.total)}</strong>
                              <div className="small text-muted">
                                {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'Fecha no disponible'}
                              </div>
                            </div>
                          </div>
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
                      );
                    })}
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
                      disabled={(orderPage + 1) * ITEMS_PER_PAGE >= orders.length}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Modal de confirmación para acciones críticas */}
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
          {/* Contenedor para notificaciones tipo toast */}
          <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
            {messageToast && <Toast {...messageToast} onClose={() => setMessageToast(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;