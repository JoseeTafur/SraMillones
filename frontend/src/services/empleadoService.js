import axios from 'axios';

// Instancia configurada para enviar la cookie JSESSIONID automáticamente
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/empleados`,
  withCredentials: true
});

export const empleadoService = {
  // Obtener la lista completa de empleados
  listar: async () => {
    const response = await api.get('');
    return response.data;
  },

  // Obtener la lista de cargos activos
  listarCargos: async () => {
    const response = await api.get('/cargos');
    return response.data;
  },

  // Obtener la lista de usuarios del sistema disponibles para vincular
  listarUsuariosDisponibles: async () => {
    const response = await api.get('/usuarios-disponibles');
    return response.data;
  },

  // Obtener un empleado por su ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  // Buscar empleados por término (nombre/DNI) o turno
  buscar: async (termino = '', turno = '') => {
    const response = await api.get('/buscar', {
      params: { termino, turno }
    });
    return response.data;
  },

  // Registrar o actualizar un empleado
  guardar: async (empleadoPayload) => {
    const response = await api.post('/guardar', empleadoPayload);
    return response.data;
  },

  // Alternar estado de disponibilidad
  cambiarEstado: async (id) => {
    const response = await api.post(`/cambiar-estado/${id}`);
    return response.data;
  },

  // Dar de baja/eliminar un empleado de las planillas
  eliminar: async (id) => {
    const response = await api.delete(`/eliminar/${id}`);
    return response.data;
  }
};

export default empleadoService;