import axios from 'axios';

const API_URL = 'http://localhost:8080/api/mesero';

export const meseroService = {
  // Cargar productos de la carta y mapa de agotados para una mesa
  obtenerDatosComandera: async (mesaId, pedidoId = null) => {
    const params = { mesaId };
    if (pedidoId) params.pedidoId = pedidoId;

    const res = await axios.get(`${API_URL}/nuevo`, {
      params,
      withCredentials: true
    });
    return res.data;
  },

  // Enviar el pedido / comanda a cocina
  guardarPedido: async (pedidoData, mesaId) => {
    const res = await axios.post(`${API_URL}/guardar`, pedidoData, {
      params: { mesaId },
      withCredentials: true
    });
    return res.data;
  },

  // Anular un plato / declarar merma
  eliminarItemComanda: async (pedidoId, detalleId, esMerma) => {
    const params = new URLSearchParams();
    params.append("pedidoId", pedidoId);
    params.append("detalleId", detalleId);
    params.append("esMerma", esMerma);

    const res = await axios.post(`${API_URL}/comanda/eliminar-item`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    });
    return res.data;
  },

  // Marcar el pedido como servido/entregado en mesa
  marcarPedidoEnMesa: async (pedidoId) => {
    const res = await axios.post(`${API_URL}/marcar-en-mesa/${pedidoId}`, {}, {
      withCredentials: true
    });
    return res.data;
  },

  // Finalizar la atención de la mesa
  finalizarAtencion: async (pedidoId, mesaId) => {
    const res = await axios.post(`${API_URL}/finalizar-atencion/${pedidoId}`, {}, {
      params: { mesaId },
      withCredentials: true
    });
    return res.data;
  },

  // Preparar precuenta
  prepararCuenta: async (pedidoId) => {
    const res = await axios.post(`${API_URL}/preparar-cuenta/${pedidoId}`, {}, {
      withCredentials: true
    });
    return res.data;
  }
};

export default meseroService;