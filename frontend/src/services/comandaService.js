import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/comandas`;

export const comandaService = {
  // Obtener la comanda activa de una mesa
  obtenerComandaMesa: async (numeroMesa) => {
    const res = await axios.get(`${API_URL}/mesa/${numeroMesa}`, {
      withCredentials: true
    });
    return res.data;
  },

  // Guardar / Enviar comanda a cocina
  guardarComanda: async (comandaData, numeroMesa) => {
    const res = await axios.post(`${API_URL}/guardar/${numeroMesa}`, comandaData, {
      withCredentials: true
    });
    return res.data;
  },

  // Trasladar comanda completa a otra mesa (autodestruye la comanda origen)
  trasladarComanda: async (mesaOrigen, mesaDestino) => {
    const params = new URLSearchParams();
    params.append("mesaOrigen", mesaOrigen);
    params.append("mesaDestino", mesaDestino);

    const res = await axios.post(`${API_URL}/trasladar`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    });
    return res.data;
  },

  // Dividir platos seleccionados a otra mesa
  dividirComanda: async (mesaOrigen, mesaDestino, idsDetalles) => {
    const params = { mesaOrigen, mesaDestino };
    const res = await axios.post(`${API_URL}/dividir`, idsDetalles, {
      params,
      withCredentials: true
    });
    return res.data;
  },

  // Eliminar detalle de comanda
  eliminarDetalleComanda: async (detalleId) => {
    const res = await axios.delete(`${API_URL}/detalle/${detalleId}`, {
      withCredentials: true
    });
    return res.data;
  }
};

export default comandaService;