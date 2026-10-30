import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/mi-perfil',
  withCredentials: true
});

export const miPerfilService = {
  obtenerMiPerfil: async () => {
    const response = await api.get('');
    return response.data;
  }
};

export default miPerfilService;