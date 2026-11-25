import api from './api';

const API_BASE_URL = 'v2/admin/cocina';

const cocinaService = {

  obtenerPedidosActivos: async () => {
    const response = await api.get(`${API_BASE_URL}/monitor`);
    return response.data;
  },

  obtainTicket: async (comandaId) => {
    const response = await api.post(`${API_BASE_URL}/ticket/${comandaId}`);
    return response.data;
  },

  completarPedido: async (pedidoId) => {
    const response = await api.post(`${API_BASE_URL}/completar?pedidoId=${pedidoId}`);
    return response.data;
  },

  completarItemIndividual: async (pedidoId, detalleId) => {
    const response = await api.post(
      `${API_BASE_URL}/completar-item?pedidoId=${pedidoId}&detalleId=${detalleId}`
    );
    return response.data;
  },

  entregarItemIndividual: async (pedidoId, detalleId) => {
    const response = await api.post(
      `${API_BASE_URL}/entregar-item?pedidoId=${pedidoId}&detalleId=${detalleId}`
    );
    return response.data;
  }
};

export default cocinaService;