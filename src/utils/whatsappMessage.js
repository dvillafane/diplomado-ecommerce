// src/utils/whatsappMessage.js
// Archivo de utilidades para generar mensajes de WhatsApp relacionados con pedidos
import { formatCurrency } from './format';

// Función para generar un mensaje de WhatsApp para un nuevo pedido
export const generateWhatsAppMessage = (user, cart, coupon, subtotal, deliveryMethod, deliveryAddress, status) => {
  // Crea una lista formateada de los ítems del carrito
  // Cada ítem incluye nombre, cantidad y precio formateado
  const itemsList = cart
    .map((item, index) => {
      const finalPrice = item.price; // Precio ya calculado en el store
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');
  // Construye el mensaje con detalles del cliente, pedido y entrega
  const message = `📦 Nuevo Pedido desde la Tienda Online
👤 Cliente: ${user.email.split('@')[0]} // Nombre del cliente (parte antes de @ en el email)
📧 Email: ${user.email}
📞 Teléfono: ${user.phone || 'No especificado'} // Teléfono del usuario o valor por defecto
🛒 Detalle del Pedido:
${itemsList} // Lista de ítems del carrito
💲 Subtotal: ${formatCurrency(subtotal)} // Subtotal formateado como moneda
🎟️ Cupón aplicado: ${coupon || 'Ninguno'} // Cupón usado o 'Ninguno' si no aplica
💰 Total a pagar: ${formatCurrency(subtotal)} // Total formateado
🚚 Método de entrega: ${deliveryMethod || 'No especificado'} // Método de entrega
📍 Dirección de entrega: ${deliveryMethod === 'Domicilio' ? (deliveryAddress || 'No especificada') : 'Recoger en tienda'} // Dirección o texto por defecto
📦 Estado: ${status || 'Pendiente'}`; // Estado del pedido
  return encodeURIComponent(message); // Codifica el mensaje para usar en URL de WhatsApp
};

// Función para generar un mensaje de WhatsApp para un pedido actualizado
export const generateOrderUpdateMessage = (user, items, coupon, total, deliveryMethod, deliveryAddress, status) => {
  // Crea una lista formateada de los ítems actualizados
  const itemsList = items
    .map((item, index) => {
      const finalPrice = item.price; // Precio ya calculado
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');
  // Construye el mensaje con detalles actualizados del pedido
  const message = `🔄 Pedido Actualizado desde la Tienda Online
👤 Cliente: ${user.email.split('@')[0]}
📧 Email: ${user.email}
📞 Teléfono: ${user.phone || 'No especificado'}
🛒 Detalle del Pedido Actualizado:
${itemsList}
💲 Subtotal: ${formatCurrency(total)}
🎟️ Cupón aplicado: ${coupon || 'Ninguno'}
💰 Total a pagar: ${formatCurrency(total)}
🚚 Método de entrega: ${deliveryMethod || 'No especificado'}
📍 Dirección de entrega: ${deliveryMethod === 'Domicilio' ? (deliveryAddress || 'No especificada') : 'Recoger en tienda'}
📦 Estado: ${status || 'Pendiente'}`;
  return encodeURIComponent(message); // Codifica el mensaje para usar en URL de WhatsApp
};

// Función para generar un mensaje de WhatsApp para un pedido cancelado
export const generateOrderDeleteMessage = (user, items, coupon, total, deliveryMethod, deliveryAddress) => {
  // Crea una lista formateada de los ítems del pedido cancelado
  const itemsList = items
    .map((item, index) => {
      const finalPrice = item.price; // Precio ya calculado
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');
  // Construye el mensaje con detalles del pedido cancelado
  const message = `🗑️ Pedido Cancelado desde la Tienda Online
👤 Cliente: ${user.email.split('@')[0]}
📧 Email: ${user.email}
📞 Teléfono: ${user.phone || 'No especificado'}
🛒 Detalle del Pedido Cancelado:
${itemsList}
💲 Subtotal: ${formatCurrency(total)}
🎟️ Cupón aplicado: ${coupon || 'Ninguno'}
💰 Total: ${formatCurrency(total)}
🚚 Método de entrega: ${deliveryMethod || 'No especificado'}
📍 Dirección de entrega: ${deliveryMethod === 'Domicilio' ? (deliveryAddress || 'No especificada') : 'Recoger en tienda'}`;
  return encodeURIComponent(message); // Codifica el mensaje para usar en URL de WhatsApp
};