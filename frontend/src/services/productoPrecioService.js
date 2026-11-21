import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/admin/productos-precios`;

const productoPrecioService = {
  listarPrecios: async () => {
    const response = await axios.get(`${API_BASE_URL}/listar`);
    return response.data;
  },

  actualizarPreciosMasivo: async (listaActualizaciones) => {
    // Normalizar la lista enviada desde React
    const payloadLimpia = (listaActualizaciones || []).map(item => ({
      idProducto: Number(item.idProducto ?? item.id),
      nuevoPrecio: parseFloat(item.nuevoPrecio ?? item.precio)
    }));

    const response = await axios.post(`${API_BASE_URL}/actualizar-precios`, payloadLimpia, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
    return response.data;
  }
};

export default productoPrecioService;