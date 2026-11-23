import api from './api'

// const API_URL = "/usuarios/api";
const API_URL = "/v2/usuarios";

export const usuarioService = {
  // Obtener rol y datos de la sesión activa
  getRolSesion: async () => {
    const response = await api.get(`${API_URL}/rol-sesion`);
    return response.data;
  },

  // Listar todos los usuarios
  listar: async () => {
    const response = await api.get(`${API_URL}/listar`);
    return response.data;
  },

  // Listar perfiles
  listarPerfiles: async () => {
    const response = await api.get(`${API_URL}/perfiles`);
    return response.data;
  },

  // Obtener usuario por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`${API_URL}/obtener/${id}`);
    return response.data;
  },

  // Guardar o actualizar
  guardar: async (usuarioData) => {
    const response = await api.post(`${API_URL}/guardar`, usuarioData);
    return response.data;
  },

  // Alternar estado
  cambiarEstado: async (id) => {
    const response = await api.post(`${API_URL}/cambiar-estado/${id}`, {});
    return response.data;
  },

  // Eliminar usuario
  eliminar: async (id) => {
    const response = await api.delete(`${API_URL}/eliminar/${id}`);
    return response.data;
  }
};

export default usuarioService;