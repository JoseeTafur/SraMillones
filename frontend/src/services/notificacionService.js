import api from './api';

export const notificacionService = {
  listarNoLeidas: async () => {
    const response = await api.get('/admin/notificaciones/api/listar-no-leidas');
    return response.data;
  },

  marcarLeidoIndividual: async (id) => {
    const response = await api.post(`/admin/notificaciones/api/marcar-leido-individual/${id}`);
    return response.data;
  },

  marcarTodoComoLeido: async () => {
    const response = await api.post('/admin/notificaciones/api/marcar-leido');
    return response.data;
  }
};