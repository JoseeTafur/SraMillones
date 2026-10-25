import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/usuarios/api`;

// Configuración global de axios o pasar explicitamente { withCredentials: true }
export const usuarioService = {
  // Obtener rol y datos de la sesión activa
  getRolSesion: async () => {
    const response = await axios.get(`${API_URL}/rol-sesion`, { withCredentials: true });
    return response.data;
  },

  // Listar todos los usuarios
  listar: async () => {
    const response = await axios.get(`${API_URL}/listar`, { withCredentials: true });
    return response.data;
  },

  // Listar perfiles
  listarPerfiles: async () => {
    const response = await axios.get(`${API_URL}/perfiles`, { withCredentials: true });
    return response.data;
  },

  // Obtener usuario por ID
  obtenerPorId: async (id) => {
    const response = await axios.get(`${API_URL}/obtener/${id}`, { withCredentials: true });
    return response.data;
  },

  // Guardar o actualizar
  guardar: async (usuarioData) => {
    const response = await axios.post(`${API_URL}/guardar`, usuarioData, { withCredentials: true });
    return response.data;
  },

  // Alternar estado
  cambiarEstado: async (id) => {
    const response = await axios.post(`${API_URL}/cambiar-estado/${id}`, {}, { withCredentials: true });
    return response.data;
  },

  // Eliminar usuario
  eliminar: async (id) => {
    const response = await axios.delete(`${API_URL}/eliminar/${id}`, { withCredentials: true });
    return response.data;
  }
};

export default usuarioService;