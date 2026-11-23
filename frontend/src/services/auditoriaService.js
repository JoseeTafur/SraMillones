import api from './api';

export const auditoriaService = {
  listarRecientes: async () => {
    const response = await api.get('/v2/admin/auditoria/api/listar');
    return response.data;
  }
};