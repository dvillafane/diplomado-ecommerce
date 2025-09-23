import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, increment, query as firestoreQuery, limit, startAfter } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Sentry from '@sentry/react';

export const calculateFinalPrice = (price, discount, globalDiscount = 0) => {
  const discountFactor = 1 - (discount || 0);
  const globalDiscountFactor = 1 - globalDiscount;
  return price * discountFactor * globalDiscountFactor;
};

const useStore = create(persist(
  (set, get) => ({
    user: null,
    authReady: false,
    products: [],
    cart: [],
    orders: [],
    categories: [],
    searchQuery: '',
    selectedCategory: '',
    loading: false,
    error: null,
    coupon: '',
    discount: 0,

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
          categories: [...new Set(products.map(p => p.category).filter(Boolean))],
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

    addToCart: (product, navigate) => {
      const { user, cart, products } = get();
      if (!user) {
        if (navigate) navigate('/login');
        return false;
      }
      const productData = products.find(p => p.id === product.id);
      if (productData.stock <= 0) {
        return false;
      }
      const existing = cart.find((item) => item.id === product.id);
      if (existing && existing.quantity >= productData.stock) {
        return false;
      }
      if (existing) {
        set({
          cart: cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          ),
        });
      } else {
        set({ cart: [...cart, { ...product, quantity: 1 }] });
      }
      return true;
    },

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

    removeFromCart: (id) => {
      set({ cart: get().cart.filter((item) => item.id !== id) });
    },

    createOrder: async (order) => {
      const { products, calculateFinalPrice } = get();
      for (const item of order.items) {
        const product = products.find(p => p.id === item.id);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.name}`);
        }
        // Ensure the item has the discounted price
        item.price = calculateFinalPrice(product.price, product.discount);
        item.originalPrice = product.price; // Store original price
        item.discount = product.discount || 0; // Store discount
      }
      try {
        const orderRef = await addDoc(collection(db, 'orders'), {
          ...order,
          status: 'pending',
          createdAt: new Date(),
        });
        const batch = writeBatch(db);
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          batch.update(productRef, {
            sales: increment(item.quantity),
            stock: increment(-item.quantity),
          });
        }
        await batch.commit();
        await get().fetchOrders();
        set({ cart: [], coupon: '', discount: 0 });
        get().sendNotification(order.userId, `Tu pedido ha sido creado con ID: ${orderRef.id}`);
        return orderRef.id;
      } catch (err) {
        console.error('Error en createOrder:', err);
        get().handleError(new Error('Error creando la orden'), 'Error creando la orden');
        throw new Error('Error creando la orden');
      }
    },

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

    updateOrder: async (id, data) => {
      try {
        const orderRef = doc(db, 'orders', id);
        const snap = await getDoc(orderRef);
        const userId = data.userId || snap.data()?.userId;
        // Recalculate total using discounted prices
        data.total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await updateDoc(orderRef, data);
        await get().fetchOrders();
        if (userId) {
          get().sendNotification(userId, `Tu pedido ${id} ha sido actualizado.`);
        }
      } catch (err) {
        console.error('Error en updateOrder:', err);
        get().handleError(new Error('Error actualizando pedido'), 'Error actualizando pedido');
      }
    },

    deleteOrder: async (id) => {
      try {
        const orderRef = doc(db, 'orders', id);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          const userId = snap.data().userId;
          await deleteDoc(orderRef);
          await get().fetchOrders();
          if (userId) {
            get().sendNotification(userId, `Tu pedido ${id} ha sido eliminado.`);
          }
        }
      } catch (err) {
        console.error('Error en deleteOrder:', err);
        get().handleError(new Error('Error eliminando pedido'), 'Error eliminando pedido');
      }
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedCategory: (category) => set({ selectedCategory: category }),

    applyCoupon: async (code) => {
      try {
        const couponRef = doc(db, 'coupons', code);
        const couponSnap = await getDoc(couponRef);
        if (!couponSnap.exists()) {
          set({ discount: 0, coupon: '' });
          return false;
        }
        const coupon = couponSnap.data();
        if (coupon.expiresAt?.toDate() < new Date() || coupon.uses >= coupon.maxUses) {
          set({ discount: 0, coupon: '' });
          return false;
        }
        set({ discount: coupon.discount, coupon: code });
        return true;
      } catch (err) {
        console.error('Error en applyCoupon:', err);
        get().handleError(new Error('Error aplicando cupón'), 'Error aplicando cupón');
        return false;
      }
    },

    calculateFinalPrice: (price, discount) => calculateFinalPrice(price, discount, get().discount),

    handleError: (err, message) => {
      console.error(message, err);
      Sentry.captureException(err, { extra: { message } });
      set({ error: message });
    },

    sendNotification: async (userId, message) => {
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        const phone = snap.data()?.phone;
        if (phone) {
          const cleanedPhone = phone.replace(/\D/g, '');
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`, '_blank');
        } else {
          console.warn('No phone number for user', userId);
        }
      } catch (err) {
        console.error('Error sending notification:', err);
      }
    },
  }),
  {
    name: 'store',
    partialize: (state) => ({
      cart: state.cart,
      coupon: state.coupon,
      discount: state.discount,
    }),
  }
));

export default useStore;