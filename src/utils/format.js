// src/utils/format.js
// Archivo de utilidades para formatear datos, específicamente valores monetarios

// Función para formatear valores numéricos como moneda en pesos colombianos (COP)
// Se utiliza en toda la aplicación para mostrar precios de manera consistente
export const formatCurrency = (value) => {
  const n = Number(value || 0); // Convierte el valor a número, usando 0 como valor por defecto si es inválido
  // Formatea el número usando la configuración regional 'es-CO' para Colombia
  // Añade el símbolo de moneda (COP) y usa separadores de miles/punto decimal adecuados
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
};