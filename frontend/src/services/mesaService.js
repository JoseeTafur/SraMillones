import axios from 'axios';

const API_URL = 'http://localhost:8080/api/mesas';

const mesaService = {
  obtenerPlanoSalon: async () => {
    const res = await axios.get(API_URL);
    return res.data;
  },

  obtenerPrecuenta: async (numeroMesa) => {
    const res = await axios.get(`${API_URL}/precuenta/${numeroMesa}`);
    return res.data;
  },

  cambiarDeMesa: async (idMesaOrigen, idMesaDestino) => {
    const res = await axios.post(`${API_URL}/trasladar`, { idMesaOrigen, idMesaDestino });
    return res.data;
  },

  dividirComanda: async (idMesaOrigen, numeroMesaDestino, idsDetalles) => {
    const res = await axios.post(`${API_URL}/dividir-comanda`, { idMesaOrigen, numeroMesaDestino, idsDetalles });
    return res.data;
  },

  agruparMesas: async (idMesaPrincipal, idsMesasHijas) => {
    const res = await axios.post(`${API_URL}/unificar`, { idMesaPrincipal, idsMesasHijas });
    return res.data;
  },

  desagruparMesa: async (idMesaPadre) => {
    const res = await axios.post(`${API_URL}/${idMesaPadre}/desagrupar`);
    return res.data;
  },

  mudarAReservaMasivo: async (idsMesas) => {
    const res = await axios.post(`${API_URL}/mudar-reserva-masivo`, { idsMesas });
    return res.data;
  },

  confirmarPagoMultiticket: async (pedidoId, mesaId, listaTickets, idsDetallesPagados) => {
    const res = await axios.post(`${API_URL}/liquidar-multiticket/${pedidoId}`, {
      mesaId,
      listaTickets,
      idsDetallesPagados
    });
    return res.data;
  },

  liberarMesa: async (idMesa) => {
    const res = await axios.post(`${API_URL}/${idMesa}/liberar`);
    return res.data;
  },

  entregarPlatoIndividual: async (comandaId, detalleId) => {
    const response = await axios.post(
      `${API_URL}/entregar-item?comandaId=${comandaId}&detalleId=${detalleId}`
    );
    return response.data;
  },

  procesarCobro: async (comandaId, mesaId, idsDetallesPagados, tickets) => {
    const response = await axios.post(`${API_URL}/procesar-cobro`, {
      comandaId,
      mesaId,
      idsDetallesPagados,
      tickets
    });
    return response.data;
  },

  eliminarItemComanda: async (detalleId) => {
  const response = await axios.delete(
    `http://localhost:8080/api/comandas/detalle/${detalleId}`,
    { withCredentials: true }
  );
  return response.data;
},
};

export default mesaService;