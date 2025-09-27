// src/store/store.js
// Configuración del store global utilizando Zustand para manejar el estado de la aplicación
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, increment, query as firestoreQuery, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Sentry from '@sentry/react';
import { generateWhatsAppMessage, generateOrderUpdateMessage, generateOrderDeleteMessage } from '../utils/whatsappMessage';
import { DELIVERY_METHODS } from '../utils/constants';

// Función auxiliar para calcular el precio final con descuento
export const calculateFinalPrice = (price, discount) => {
  const discountFactor = Math.max(0, 1 - (discount || 0)); // Asegurar que el descuento no exceda 100%
  return price * discountFactor;
};

// Creación del store con Zustand, incluyendo persistencia de ciertos estados
const useStore = create(persist(
  (set, get) => ({
    // Estados iniciales del store
    user: null, // Datos del usuario autenticado
    authReady: false, // Indica si la autenticación está lista
    products: [], // Lista de productos
    cart: [], // Carrito de compras
    orders: [], // Lista de pedidos
    categories: [], // Lista de categorías
    searchQuery: '', // Consulta de búsqueda
    selectedCategory: '', // Categoría seleccionada
    loading: false, // Estado de carga
    error: null, // Errores de la aplicación
    coupon: '', // Código de cupón aplicado
    discount: 0, // Descuento del cupón
    appliedPromoCode: null, // Datos del cupón aplicado

    // Establece el usuario autenticado y sus datos desde Firestore
    setUser: async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, authReady: true });
        return;
      }
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const extraData = snap.exists() ? snap.data() : { isAdmin: false };
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAdmin: false,
            ...extraData,
          },
          authReady: true,
        });
      } catch (err) {
        console.error('Error en setUser:', err);
        get().handleError(new Error('Error obteniendo datos de usuario'), 'Error obteniendo datos de usuario');
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAdmin: false,
          },
          authReady: true,
        });
      }
    },

    // Actualiza el número de celular del usuario en Firestore
    updateUserPhone: async (uid, phone) => {
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { phone });
        set((state) => ({
          user: { ...state.user, phone },
        }));
      } catch (err) {
        console.error('Error en updateUserPhone:', err);
        get().handleError(new Error('Error actualizando número de celular'), 'Error actualizando número de celular');
        throw err;
      }
    },

    // Obtiene productos desde Firestore con paginación
    fetchProducts: async (startAfterDoc = null, limitCount = 10) => {
      set({ loading: true, error: null });
      try {
        let productsQuery = firestoreQuery(collection(db, 'products'), limit(limitCount));
        if (startAfterDoc) {
          productsQuery = firestoreQuery(collection(db, 'products'), startAfter(startAfterDoc), limit(limitCount));
        }
        const snapshot = await getDocs(productsQuery);
        console.log('Products snapshot size:', snapshot.size);
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched products:', products);
        set({
          products,
          categories: [...new Set(products.map(p => p.category).filter(Boolean))], // Extrae categorías únicas
        });
        return products;
      } catch (err) {
        console.error('Error en fetchProducts:', err);
        get().handleError(new Error(`No se pudieron cargar los productos: ${err.message}`), `No se pudieron cargar los productos: ${err.message}`);
        return [];
      } finally {
        set({ loading: false });
      }
    },

    // Obtiene categorías desde Firestore
    fetchCategories: async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const categories = snapshot.docs.map(doc => doc.data().name);
        console.log('Fetched categories:', categories);
        set({ categories });
        return categories;
      } catch (err) {
        console.error('Error en fetchCategories:', err);
        get().handleError(new Error('Error cargando categorías'), 'Error cargando categorías');
        return [];
      }
    },

    // Obtiene pedidos desde Firestore con datos de usuario asociados
    fetchOrders: async (startAfterDoc = null, limitCount = 10) => {
      set({ loading: true, error: null });
      try {
        let orderQuery = firestoreQuery(collection(db, 'orders'), limit(limitCount));
        if (startAfterDoc) {
          orderQuery = firestoreQuery(collection(db, 'orders'), startAfter(startAfterDoc), limit(limitCount));
        }
        const snapshot = await getDocs(orderQuery);
        console.log('Orders snapshot size:', snapshot.size);
        const orders = await Promise.all(snapshot.docs.map(async (doc) => {
            const orderData = { id: doc.id, ...doc.data() };
            console.log('Datos del pedido:', orderData);
            try {
                if (orderData.userId) {
                    const userRef = doc(db, 'users', orderData.userId);
                    const userSnap = await getDoc(userRef);
                    orderData.userEmail = userSnap.exists() ? userSnap.data().email : 'Unknown';
                    orderData.userPhone = userSnap.exists() ? userSnap.data().phone : '';
                }
            } catch (err) {
                console.warn(`Failed to fetch user data for order ${doc.id}:`, err);
                orderData.userEmail = 'Unknown';
                orderData.userPhone = '';
            }
            return orderData;
        }));
        console.log('Fetched orders:', orders);
        set({ orders });
        return orders;
      } catch (err) {
        console.error('Error en fetchOrders:', err);
        get().handleError(new Error(`Error cargando órdenes: ${err.message}`), `Error cargando órdenes: ${err.message}`);
        return [];
      } finally {
        set({ loading: false });
      }
    },

    // Agrega un producto al carrito
    addToCart: (product, navigate) => {
      const { user, cart, products } = get();
      if (!user) {
        if (navigate) navigate('/login');
        return false;
      }
      const productData = products.find(p => p.id === product.id);
      if (!productData || productData.stock <= 0) {
        return false;
      }
      // Obtener la cantidad solicitada, asegurándose de que sea válida
      const requestedQuantity = Math.max(1, parseInt(product.quantity) || 1);
      // Validar que la cantidad no exceda el stock
      if (requestedQuantity > productData.stock) {
        return false;
      }
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        // Si el producto ya está en el carrito, sumar la cantidad solicitada
        const newQuantity = existing.quantity + requestedQuantity;
        if (newQuantity > productData.stock) {
          return false;
        }
        set({
          cart: cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          ),
        });
      } else {
        // Si el producto no está en el carrito, agregarlo con la cantidad solicitada
        set({ cart: [...cart, { ...product, quantity: requestedQuantity }] });
      }
      return true;
    },

    // Actualiza la cantidad de un producto en el carrito
    updateCartQuantity: (id, quantity) => {
      const { cart, products } = get();
      const productData = products.find(p => p.id === id);
      if (quantity <= 0 || quantity > productData.stock) {
        return;
      }
      set({
        cart: cart.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
      });
    },

    // Elimina un producto del carrito
    removeFromCart: (id) => {
      set({ cart: get().cart.filter((item) => item.id !== id) });
    },

    // Aplica un código promocional
    applyCoupon: async (code) => {
      try {
        const promoQuery = firestoreQuery(
          collection(db, 'promoCodes'),
          where('code', '==', code.toUpperCase())
        );
        const promoSnap = await getDocs(promoQuery);
        if (promoSnap.empty) {
          set({ discount: 0, coupon: '', appliedPromoCode: null });
          return false;
        }
        const promoDoc = promoSnap.docs[0];
        const promo = promoDoc.data();
        const now = new Date();
        if (!promo.isActive || promo.expiresAt?.toDate() < now || promo.uses >= promo.maxUses) {
          set({ discount: 0, coupon: '', appliedPromoCode: null });
          return false;
        }
        set({
          discount: promo.discount,
          coupon: code.toUpperCase(),
          appliedPromoCode: { id: promoDoc.id, ...promo }
        });
        return true;
      } catch (err) {
        console.error('Error en applyCoupon:', err);
        get().handleError(new Error('Error aplicando cupón'), 'Error aplicando cupón');
        set({ discount: 0, coupon: '', appliedPromoCode: null });
        return false;
      }
    },

    // Consume un código promocional incrementando su contador de usos
    consumePromoCode: async (code) => {
      try {
        const { appliedPromoCode } = get();
        if (!appliedPromoCode || appliedPromoCode.code !== code.toUpperCase()) {
          return false;
        }
        const promoRef = doc(db, 'promoCodes', appliedPromoCode.id);
        await updateDoc(promoRef, {
          uses: increment(1)
        });
        return true;
      } catch (err) {
        console.error('Error en consumePromoCode:', err);
        get().handleError(new Error('Error usando cupón'), 'Error usando cupón');
        return false;
      }
    },

    // Crea un nuevo pedido en Firestore
    createOrder: async (order) => {
      const { products, calculateFinalPrice, coupon, consumePromoCode, discount } = get();
      if (!DELIVERY_METHODS.includes(order.deliveryMethod)) {
        throw new Error('Método de entrega inválido');
      }
      if (order.deliveryMethod === DELIVERY_METHODS[0] && (!order.deliveryAddress || order.deliveryAddress.trim().length < 10)) {
        throw new Error('La dirección de entrega debe tener al menos 10 caracteres para entrega a domicilio');
      }
      // Calcular subtotal con descuentos individuales
      const subtotal = order.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.name}`);
        }
        item.price = calculateFinalPrice(product.price, product.discount);
        item.originalPrice = product.price;
        item.discount = product.discount || 0;
        return sum + (item.price * item.quantity);
      }, 0);
      // Aplicar descuento del cupón
      const couponDiscount = discount > 0 ? subtotal * discount : 0;
      const finalTotal = Math.max(0, subtotal - couponDiscount);
     
      try {
        const orderData = {
          ...order,
          total: finalTotal,
          couponDiscount: couponDiscount,
          status: 'pending',
          statusHistory: [{ status: 'pending', date: new Date() }],
          createdAt: new Date(),
          appliedCoupon: coupon || null
        };
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        console.log('Order saved in Firestore:', { id: orderRef.id, ...orderData });
       
        const batch = writeBatch(db);
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          batch.update(productRef, {
            sales: increment(item.quantity),
            stock: increment(-item.quantity),
          });
        }
        await batch.commit();
        if (coupon) {
          await consumePromoCode(coupon);
        }
        await get().fetchOrders();
        set({ cart: [], coupon: '', discount: 0, appliedPromoCode: null });
       
        const message = generateWhatsAppMessage(
          get().user,
          order.items,
          coupon,
          finalTotal,
          order.deliveryMethod,
          order.deliveryAddress,
          orderData.status
        );
        get().sendNotification(order.userId, message);
        return orderRef.id;
      } catch (err) {
        console.error('Error en createOrder:', err);
        get().handleError(new Error('Error creando la orden: ' + err.message), 'Error creando la orden');
        throw new Error('Error creando la orden');
      }
    },

    // Actualiza un producto en Firestore
    updateProduct: async (id, data) => {
      try {
        const { orders } = get();
        const pendingOrders = orders.filter(o => o.status !== 'delivered' && o.items.some(i => i.id === id));
        const totalReserved = pendingOrders.reduce((sum, o) => {
          const item = o.items.find(i => i.id === id);
          return sum + (item ? item.quantity : 0);
        }, 0);
        if (data.stock < totalReserved) {
          throw new Error(`Stock insuficiente. Hay ${totalReserved} unidades reservadas en pedidos activos.`);
        }
        await updateDoc(doc(db, 'products', id), data);
        await get().fetchProducts();
      } catch (err) {
        console.error('Error en updateProduct:', err);
        get().handleError(err, `Error actualizando producto: ${err.message}`);
        throw err;
      }
    },

    // Actualiza un pedido en Firestore
    updateOrder: async (id, data) => {
      try {
          console.log('Intentando actualizar pedido:', { id, data });
          const orderRef = doc(db, 'orders', id);
          const snap = await getDoc(orderRef);
          if (!snap.exists()) {
              throw new Error('El pedido no existe');
          }
          const existingData = snap.data();
          console.log('Datos existentes del pedido:', existingData);
          const userId = data.userId || existingData.userId;
          if ('deliveryMethod' in data && !DELIVERY_METHODS.includes(data.deliveryMethod)) {
              throw new Error('Método de entrega inválido');
          }
          if (data.deliveryMethod === DELIVERY_METHODS[0] && (!data.deliveryAddress || data.deliveryAddress.trim().length < 10)) {
              throw new Error('La dirección de entrega debe tener al menos 10 caracteres para entrega a domicilio');
          }
          if (data.deliveryMethod === DELIVERY_METHODS[1]) {
              data.deliveryAddress = null;
          }
          if (data.items) {
              for (const item of data.items) {
                  const product = get().products.find(p => p.id === item.id);
                  if (!product || product.stock < item.quantity) {
                      throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${product?.stock || 0}.`);
                  }
              }
          }
          const subtotal = data.items ? data.items.reduce((sum, item) => {
              const product = get().products.find(p => p.id === item.id);
              item.price = product ? calculateFinalPrice(product.price, product.discount) : item.price;
              return sum + item.price * item.quantity;
          }, 0) : existingData.total;
          const couponDiscount = get().discount > 0 ? subtotal * get().discount : (existingData.couponDiscount || 0);
          data.total = Math.max(0, subtotal - couponDiscount);
          data.couponDiscount = couponDiscount;
          if (data.status && data.status !== existingData.status) {
              data.statusHistory = [...(existingData.statusHistory || []), { status: data.status, date: new Date() }];
              console.log('Actualizando statusHistory:', data.statusHistory);
          }
          console.log('Datos a actualizar en Firestore:', data);
          await updateDoc(orderRef, data);
          console.log('Pedido actualizado en Firestore:', { id, ...data });
          await get().fetchOrders();
          if (userId) {
              const finalDeliveryMethod = data.deliveryMethod || existingData.deliveryMethod || 'No especificado';
              const finalDeliveryAddress = finalDeliveryMethod === DELIVERY_METHODS[0]
                  ? (data.deliveryAddress || existingData.deliveryAddress || 'No especificada')
                  : 'Recoger en tienda';
              const message = generateOrderUpdateMessage(
                  get().user,
                  data.items || existingData.items,
                  get().coupon,
                  data.total,
                  finalDeliveryMethod,
                  finalDeliveryAddress,
                  data.status || existingData.status
              );
              get().sendNotification(userId, message);
          }
      } catch (err) {
          console.error('Error en updateOrder:', err);
          get().handleError(new Error(`Error actualizando pedido: ${err.message}`), `Error actualizando pedido`);
          throw err;
      }
    },

    // Elimina un pedido de Firestore
    deleteOrder: async (id) => {
      try {
        const orderRef = doc(db, 'orders', id);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          const orderData = snap.data();
          const userId = orderData.userId;
          const message = generateOrderDeleteMessage(
            get().user,
            orderData.items,
            get().coupon,
            orderData.total,
            orderData.deliveryMethod,
            orderData.deliveryAddress
          );
          await deleteDoc(orderRef);
          await get().fetchOrders();
          if (userId) {
            get().sendNotification(userId, message);
          }
        }
      } catch (err) {
        console.error('Error en deleteOrder:', err);
        get().handleError(new Error('Error eliminando pedido'), 'Error eliminando pedido');
      }
    },

    // Actualiza la consulta de búsqueda
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Actualiza la categoría seleccionada
    setSelectedCategory: (category) => set({ selectedCategory: category }),

    // Expone la función calculateFinalPrice
    calculateFinalPrice: (price, discount) => calculateFinalPrice(price, discount),

    // Maneja errores y los registra en Sentry
    handleError: (err, message) => {
      console.error(message, err);
      Sentry.captureException(err, { extra: { message } });
      set({ error: message });
    },

    // Envía notificaciones por WhatsApp
    sendNotification: async (userId, message) => {
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        const phone = snap.data()?.phone;
        if (!phone) {
          throw new Error('El usuario no tiene un número de celular registrado');
        }
        const cleanedPhone = phone.replace(/\D/g, '');
        if (!cleanedPhone) {
          throw new Error('El número de celular del usuario no es válido');
        }
        window.open(`https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${message}`, '_blank');
      } catch (err) {
        console.error('Error enviando notificación:', err);
        get().handleError(new Error('Error enviando notificación: ' + err.message), 'Error enviando notificación');
      }
    },
  }),
  {
    name: 'store',
    partialize: (state) => ({
      cart: state.cart,
      coupon: state.coupon,
      discount: state.discount,
      appliedPromoCode: state.appliedPromoCode,
    }), // Persiste solo ciertos estados en el almacenamiento local
  }
));

export default useStore;