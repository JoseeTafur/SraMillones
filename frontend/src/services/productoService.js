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

    if (archivoImagen instanceof File) {
      formData.append('archivoImagen', archivoImagen);
    } else {
      // Si no hay archivo nuevo, mandamos la URL (si no es un blob temporal) o vacío si la quitó
      const urlLimpia = (productoData.imagen && !productoData.imagen.startsWith('blob:'))
        ? productoData.imagen
        : '';
      formData.append('imagen', urlLimpia);
      formData.append('eliminarImagen', urlLimpia === '');
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
  },

  obtenerCartaPublica: async () => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const response = await axios.get(`${base}/api/public/carta`);
    return response.data;
  }
};

export default productoService;