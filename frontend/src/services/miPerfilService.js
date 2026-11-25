import api from './api';

const API_URL = "/v2/mi-perfil";

export const miPerfilService = {
  obtenerMiPerfil: async () => {
    const response = await api.get(API_URL);
    return response.data;
  }
};

export default miPerfilService;