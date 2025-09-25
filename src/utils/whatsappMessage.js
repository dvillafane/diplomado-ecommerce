import { formatCurrency } from './format';

export const generateWhatsAppMessage = (user, cart, coupon, subtotal, deliveryMethod, deliveryAddress) => {
  const itemsList = cart
    .map((item, index) => {
      const finalPrice = item.price; // Price already calculated in store
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');

  const message = `📦 Nuevo Pedido desde la Tienda Online
👤 Cliente: ${user.email.split('@')[0]}
📧 Email: ${user.email}
📞 Teléfono: ${user.phone || 'No especificado'}
🛒 Detalle del Pedido:
${itemsList}
💲 Subtotal: ${formatCurrency(subtotal)}
🎟️ Cupón aplicado: ${coupon || 'Ninguno'}
💰 Total a pagar: ${formatCurrency(subtotal)}
🚚 Método de entrega: ${deliveryMethod || 'No especificado'}
📍 Dirección de entrega: ${deliveryMethod === 'Domicilio' ? (deliveryAddress || 'No especificada') : 'Recoger en tienda'}`;

  return encodeURIComponent(message);
};

export const generateOrderUpdateMessage = (user, items, coupon, total, deliveryMethod, deliveryAddress) => {
  const itemsList = items
    .map((item, index) => {
      const finalPrice = item.price; // Price already calculated
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');

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
📍 Dirección de entrega: ${deliveryMethod === 'Domicilio' ? (deliveryAddress || 'No especificada') : 'Recoger en tienda'}`;

  return encodeURIComponent(message);
};

export const generateOrderDeleteMessage = (user, items, coupon, total, deliveryMethod, deliveryAddress) => {
  const itemsList = items
    .map((item, index) => {
      const finalPrice = item.price; // Price already calculated
      return `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Precio: ${formatCurrency(finalPrice)}`;
    })
    .join('\n');

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

  return encodeURIComponent(message);
};