import api from './api';

const API_URL = `/v2/admin/productos`;
const API_URL_CARTA = "/v2/public/carta";

const productoClient = api;

const productoService = {
  obtenerCatalogoInicial: async () => {
    const response = await productoClient.get(API_URL);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await productoClient.get(`${API_URL}/${id}`);
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

    const response = await productoClient.post(`${API_URL}/guardar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await productoClient.post(`${API_URL}/estado/${id}?estado=${estado}`);
    return response.data;
  },

  eliminarLogico: async (id) => {
    const response = await productoClient.put(`${API_URL}/eliminar/${id}`);
    return response.data;
  },

  obtenerCartaPublica: async () => {
    const response = await api.get(API_URL_CARTA);
    return response.data;
  }
};

export default productoService;