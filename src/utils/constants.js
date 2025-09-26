// src/utils/constants.js
// Archivo de constantes globales que define valores reutilizables en toda la aplicación
// Ayuda a mantener la consistencia y facilita el mantenimiento del código

// Lista de categorías disponibles para productos
// Se utiliza en formularios de creación/edición y filtros de la tienda
export const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Accesorios', 'Otros'];

// Estados posibles para los pedidos
// Define el ciclo de vida de un pedido: pendiente → enviado → entregado
export const ORDER_STATUSES = ['pending', 'shipped', 'delivered'];

// Número de elementos por página en listas paginadas
// Se aplica en la administración para productos, pedidos y códigos promocionales
export const ITEMS_PER_PAGE = 10;

// Objeto que centraliza todas las rutas de la aplicación
// Facilita la navegación y evita errores tipográficos en los enlaces
export const ROUTES = {
  HOME: '/', // Ruta principal de la aplicación
  SHOP: '/tienda', // Página de la tienda con todos los productos
  PRODUCT_PATH: '/producto/:id',     // Patrón de ruta para detalles de producto (usado en configuración de React Router)
  PRODUCT: (id) => `/producto/${id}`, // Función para generar URLs dinámicas de productos específicos
  CART: '/carrito', // Página del carrito de compras
  LOGIN: '/login', // Página de inicio de sesión
  REGISTER: '/register', // Página de registro de usuario
  ADMIN: '/admin', // Panel de administración (protegido)
  HISTORY: '/historial', // Historial de compras del usuario
  NOT_FOUND: '*', // Ruta fallback para páginas no encontradas (404)
};

// Métodos de entrega disponibles para los pedidos
// Se utiliza en formularios de checkout y validaciones de pedidos
export const DELIVERY_METHODS = ['Domicilio', 'Recoger en tienda'];