import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/admin/productos`;

const productoService = {
  obtenerCatalogoInicial: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  guardarOEditar: async (productoData, archivoImagen) => {
    const formData = new FormData();
    
    if (productoData.id) formData.append('id', productoData.id);
    formData.append('nombre', productoData.nombre);
    formData.append('descripcion', productoData.descripcion || '');
    formData.append('precio', productoData.precio);
    formData.append('categoriaId', productoData.categoriaId);

    if (archivoImagen) {
      formData.append('archivoImagen', archivoImagen);
    }

    const response = await axios.post(`${API_BASE_URL}/guardar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await axios.post(`${API_BASE_URL}/estado/${id}?estado=${estado}`);
    return response.data;
  },

  eliminarLogico: async (id) => {
    const response = await axios.put(`${API_BASE_URL}/eliminar/${id}`);
    return response.data;
  }
};

export default productoService;
