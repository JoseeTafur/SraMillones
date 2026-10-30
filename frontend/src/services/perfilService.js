import axios from 'axios';

// La ruta correcta en Spring Boot es /perfiles/api
const API_URL = 'http://localhost:8080/perfiles/api';

export const perfilService = {
  // Listar todos los perfiles activos
  listar: async () => {
    const response = await axios.get(`${API_URL}/listar`);
    return response.data;
  },

  // Obtener un perfil con sus opciones asignadas
  obtenerPorId: async (id) => {
    const response = await axios.get(`${API_URL}/obtener/${id}`);
    return response.data;
  },

  // Guardar o actualizar perfil
  guardar: async (perfilData) => {
    const response = await axios.post(`${API_URL}/guardar`, perfilData);
    return response.data;
  },

  // Alternar estado (activo / inactivo)
  cambiarEstado: async (id) => {
    const response = await axios.post(`${API_URL}/cambiar-estado/${id}`);
    return response.data;
  },

  // Eliminar perfil
  eliminar: async (id) => {
    const response = await axios.delete(`${API_URL}/eliminar/${id}`);
    return response.data;
  },

  // Obtener opciones/módulos
  listarOpciones: async () => {
    const response = await axios.get(`${API_URL}/opciones`);
    return response.data;
  }
};

export default perfilService;