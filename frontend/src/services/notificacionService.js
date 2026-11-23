import api from './api';

const API_URL = "/v2/notificaciones";

export const notificacionService = {
  listarNoLeidas: async () => {
    const response = await api.get(`${API_URL}/listar-no-leidas`);
    return response.data;
  },

  marcarLeidoIndividual: async (id) => {
    const response = await api.post(`${API_URL}/marcar-leido-individual/${id}`);
    return response.data;
  },

  marcarTodoComoLeido: async () => {
    const response = await api.post(`${API_URL}/marcar-leido`);
    return response.data;
  }
};