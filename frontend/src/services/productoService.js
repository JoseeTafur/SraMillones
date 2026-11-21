import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = `${BASE_URL}/api/admin/productos`;

const productoClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const productoService = {
  obtenerCatalogoInicial: async () => {
    const response = await productoClient.get('');
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await productoClient.get(`/${id}`);
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
      const urlLimpia = (productoData.imagen && !productoData.imagen.startsWith('blob:'))
        ? productoData.imagen
        : '';
      formData.append('imagen', urlLimpia);
      formData.append('eliminarImagen', urlLimpia === '');
    }

    const response = await productoClient.post('/guardar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await productoClient.post(`/estado/${id}?estado=${estado}`);
    return response.data;
  },

  eliminarLogico: async (id) => {
    const response = await productoClient.put(`/eliminar/${id}`);
    return response.data;
  },

  obtenerCartaPublica: async () => {
    const response = await axios.get(`${BASE_URL}/api/public/carta`);
    return response.data;
  }
};

export default productoService;