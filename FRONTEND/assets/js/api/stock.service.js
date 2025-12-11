import { request } from './apiClient.js';

export const stockService = {

  // ------------------------------------
  //   Crear Stock
  // ------------------------------------
  CreateStock: (data) => {
    return request('/stock/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ------------------------------------
  //   Obtener stock por ID de producto
  // ------------------------------------
  GetStockById: (id_producto) => {
    return request(`/stock/by-id/${id_producto}`);
  },

  // ------------------------------------
  //   Actualizar stock
  // ------------------------------------
  UpdateStock: (id_producto, data) => {
    return request(`/stock/by-id/${id_producto}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ------------------------------------
  //   Obtener TODO el stock
  // ------------------------------------
  GetStockAll: () => {
    return request('/stock/stock/all');
  }

  // ------------------------------------
  //   Obtener stock paginado
  // ------------------------------------

};
