import api from './api';

// La ruta correcta en Spring Boot es /perfiles/api
const API_URL = `v2/perfiles`;

export const perfilService = {
  // Listar todos los perfiles activos
  listar: async () => {
    const response = await api.get(`${API_URL}/listar`, { withCredentials: true });
    return response.data;
  },

  // Obtener un perfil con sus opciones asignadas
  obtenerPorId: async (id) => {
    const response = await api.get(`${API_URL}/obtener/${id}`, { withCredentials: true });
    return response.data;
  },

  // Guardar o actualizar perfil
  guardar: async (perfilData) => {
    const response = await api.post(`${API_URL}/guardar`, perfilData, { withCredentials: true });
    return response.data;
  },

  // Alternar estado (activo / inactivo)
  cambiarEstado: async (id) => {
    const response = await api.post(`${API_URL}/cambiar-estado/${id}`, {}, { withCredentials: true });
    return response.data;
  },

  // Eliminar perfil
  eliminar: async (id) => {
    const response = await api.delete(`${API_URL}/eliminar/${id}`, { withCredentials: true });
    return response.data;
  },

  // Obtener opciones/módulos
  listarOpciones: async () => {
    const response = await api.get(`${API_URL}/opciones`, { withCredentials: true });
    return response.data;
  }
};

export default perfilService;