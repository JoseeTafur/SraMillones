import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin/cocina';

const cocinaService = {

  obtenerPedidosActivos: async () => {
    const response = await axios.get(`${API_BASE_URL}/monitor`);
    return response.data;
  },

  obtainTicket: async (comandaId) => {
    const response = await axios.post(`${API_BASE_URL}/ticket/${comandaId}`);
    return response.data;
  },

  completarPedido: async (pedidoId) => {
    const response = await axios.post(`${API_BASE_URL}/completar?pedidoId=${pedidoId}`);
    return response.data;
  },

  completarItemIndividual: async (pedidoId, detalleId) => {
    const response = await axios.post(
      `${API_BASE_URL}/completar-item?pedidoId=${pedidoId}&detalleId=${detalleId}`
    );
    return response.data;
  },

  entregarItemIndividual: async (pedidoId, detalleId) => {
    const response = await axios.post(
      `${API_BASE_URL}/entregar-item?pedidoId=${pedidoId}&detalleId=${detalleId}`
    );
    return response.data;
  }
};

export default cocinaService;