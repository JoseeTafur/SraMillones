import api from './api';

const API_URL = "/v2/reservas"

export const getReservas = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const createReserva = async (reservaData) => {
  const response = await api.post(API_URL, reservaData);
  return response.data;
};

export const updateReserva = async (id, reservaData) => {
  const response = await api.put(`${API_URL}/${id}`, reservaData);
  return response.data;
};

export const deleteReserva = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

export const confirmarLlegada = async (id) => {
  const response = await api.post(`${API_URL}/${id}/confirmar-llegada`);
  return response.data;
};

export const cancelarReserva = async (id) => {
  const response = await api.post(`${API_URL}/${id}/cancelar`);
  return response.data;
};