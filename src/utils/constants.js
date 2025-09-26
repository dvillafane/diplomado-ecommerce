// src/utils/constants.js
export const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Accesorios', 'Otros'];

export const ORDER_STATUSES = ['pending', 'shipped', 'delivered'];

export const ITEMS_PER_PAGE = 10;

export const ROUTES = {
  HOME: '/',
  SHOP: '/tienda',
  PRODUCT_PATH: '/producto/:id',     // para definir la ruta en <Route>
  PRODUCT: (id) => `/producto/${id}`, // para generar enlaces dinámicos
  CART: '/carrito',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  HISTORY: '/historial',
  NOT_FOUND: '*', // fallback
};
export const DELIVERY_METHODS = ['Domicilio', 'Recoger en tienda'];