import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/mesas`;

const mesaClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const mesaService = {
  obtenerPlanoSalon: async () => {
    const res = await mesaClient.get('/api/mesas');
    return res.data;
  },

  obtenerPrecuenta: async (numeroMesa) => {
    const res = await mesaClient.get(`/api/mesas/precuenta/${numeroMesa}`);
    return res.data;
  },

  cambiarDeMesa: async (idMesaOrigen, idMesaDestino) => {
    const res = await mesaClient.post('/api/mesas/trasladar', {
      idMesaOrigen,
      idMesaDestino
    });
    return res.data;
  },

  dividirComanda: async (idMesaOrigen, numeroMesaDestino, idsDetalles) => {
    const res = await mesaClient.post('/api/mesas/dividir-comanda', {
      idMesaOrigen,
      numeroMesaDestino,
      idsDetalles
    });
    return res.data;
  },

  agruparMesas: async (idMesaPrincipal, idsMesasHijas) => {
    const res = await mesaClient.post('/api/mesas/unificar', {
      idMesaPrincipal,
      idsMesasHijas
    });
    return res.data;
  },

  desagruparMesa: async (idMesaPadre) => {
    const res = await mesaClient.post(`/api/mesas/${idMesaPadre}/desagrupar`);
    return res.data;
  },

  desvincularMesa: async (idMesa) => {
    const res = await mesaClient.post(`/api/mesas/${idMesa}/desvincular`);
    return res.data;
  },

  mudarAReservaMasivo: async (idsMesas) => {
    const res = await mesaClient.post('/api/mesas/mudar-reserva-masivo', {
      idsMesas
    });
    return res.data;
  },

  quitarDeReservaMasivo: async (idsMesas) => {
    const res = await mesaClient.post('/api/mesas/quitar-reserva-masivo', {
      idsMesas
    });
    return res.data;
  },

  confirmarPagoMultiticket: async (pedidoId, mesaId, listaTickets, idsDetallesPagados) => {
    const res = await mesaClient.post(`/api/mesas/liquidar-multiticket/${pedidoId}`, {
      mesaId,
      listaTickets,
      idsDetallesPagados
    });
    return res.data;
  },

  liberarMesa: async (idMesa) => {
    const res = await mesaClient.post(`/api/mesas/${idMesa}/liberar`);
    return res.data;
  },

  liberarMesaManual: async (numeroMesa) => {
    const res = await mesaClient.post(`/api/mesas/liberar-manual/${numeroMesa}`);
    return res.data;
  },

  entregarPlatoIndividual: async (comandaId, detalleId) => {
    const response = await mesaClient.post(
      `/api/mesas/entregar-item?comandaId=${comandaId}&detalleId=${detalleId}`
    );
    return response.data;
  },

  procesarCobro: async (comandaId, mesaId, idsDetallesPagados, tickets) => {
    const response = await mesaClient.post('/api/mesas/procesar-cobro', {
      comandaId,
      mesaId,
      idsDetallesPagados,
      tickets
    });
    return response.data;
  },

  eliminarItemComanda: async (detalleId) => {
    const response = await mesaClient.delete(`/api/comandas/detalle/${detalleId}`);
    return response.data;
  }
};

export default mesaService;