// src/utils/constants.js
export const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Accesorios', 'Otros'];

export const ORDER_STATUSES = ['pending', 'shipped', 'delivered'];

export const ITEMS_PER_PAGE = 10;

export const ROUTES = {
  HOME: '/',
  SHOP: '/tienda',
  CART: '/carrito',
  ADMIN: '/admin',
  HISTORY: '/historial',
  PRODUCT: (id) => `/producto/${id}`,
};

export const DELIVERY_METHODS = ['Domicilio', 'Recoger en tienda'];