import api from './api';

const API_URL = "/v2/empleados"

export const empleadoService = {
  // Obtener la lista completa de empleados
  listar: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  // Obtener la lista de cargos activos
  listarCargos: async () => {
    const response = await api.get(`${API_URL}/cargos`);
    return response.data;
  },

  // Obtener la lista de usuarios del sistema disponibles para vincular
  listarUsuariosDisponibles: async () => {
    const response = await api.get(`${API_URL}/usuarios-disponibles`);
    return response.data;
  },

  // Obtener un empleado por su ID
  obtenerPorId: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Buscar empleados por término (nombre/DNI) o turno
  buscar: async (termino = '', turno = '') => {
    const response = await api.get(`${API_URL}/buscar`, {
      params: { termino, turno }
    });
    return response.data;
  },

  // Registrar o actualizar un empleado
  guardar: async (empleadoPayload) => {
    const response = await api.post(`${API_URL}/guardar`, empleadoPayload);
    return response.data;
  },

  // Alternar estado de disponibilidad
  cambiarEstado: async (id) => {
    const response = await api.post(`${API_URL}/cambiar-estado/${id}`);
    return response.data;
  },

  // Dar de baja/eliminar un empleado de las planillas
  eliminar: async (id) => {
    const response = await api.delete(`${API_URL}/eliminar/${id}`);
    return response.data;
  }
};

export default empleadoService;