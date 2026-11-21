import axios from 'axios';

// Instancia configurada para enviar la cookie JSESSIONID automáticamente
const api = axios.create({
  baseURL: 'http://localhost:8080/api/clientes',
  withCredentials: true
});

export const clienteService = {
  // Buscar clientes por estado ('1' activos, '0' inactivos) y texto (nombre/DNI/correo)
  // GET /api/clientes?estado=&texto=&page=&size=
  buscar: async (estado = 'todos', texto = '', page = 0, size = 100) => {
    const response = await api.get('', {
      params: { estado, texto, page, size }
    });
    return response.data;
  },

  // Obtener un cliente por su ID
  // GET /api/clientes/{id}
  obtener: async (id) => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  // Registrar un cliente (ClienteSaveDTO)
  // POST /api/clientes
  crear: async (clientePayload) => {
    const response = await api.post('', clientePayload);
    return response.data;
  },

  // Actualizar un cliente existente
  // PUT /api/clientes/{id}
  actualizar: async (id, clientePayload) => {
    const response = await api.put(`/${id}`, clientePayload);
    return response.data;
  },

  // Alternar estado activo/inactivo
  // PATCH /api/clientes/{id}/alternar
  alternarEstado: async (id) => {
    const response = await api.patch(`/${id}/alternar`);
    return response.data;
  },

  // Eliminar definitivamente un cliente
  // DELETE /api/clientes/{id}/eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/${id}/eliminar`);
    return response.data;
  }
};

export default clienteService;