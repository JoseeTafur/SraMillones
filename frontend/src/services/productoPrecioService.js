import api from './api';

const API_URL = `/v2/admin/productos-precios`;

const productoPrecioService = {
  listarPrecios: async () => {
    const response = await api.get(`${API_URL}/listar`);
    return response.data;
  },

  actualizarPreciosMasivo: async (listaActualizaciones) => {
    // Normalizar la lista enviada desde React
    const payloadLimpia = (listaActualizaciones || []).map(item => ({
      idProducto: Number(item.idProducto ?? item.id),
      nuevoPrecio: parseFloat(item.nuevoPrecio ?? item.precio)
    }));

    const response = await api.post(`${API_URL}/actualizar-precios`, payloadLimpia, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
    return response.data;
  }
};

export default productoPrecioService;