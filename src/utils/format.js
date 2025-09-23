// src/utils/format.js
export const formatCurrency = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
};
