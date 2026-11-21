import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/reservas`,
  withCredentials: true
});

export const getReservas = async () => {
  const response = await api.get('');
  return response.data;
};

export const createReserva = async (reservaData) => {
  const response = await api.post('', reservaData);
  return response.data;
};

export const updateReserva = async (id, reservaData) => {
  const response = await api.put(`/${id}`, reservaData);
  return response.data;
};

export const deleteReserva = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const confirmarLlegada = async (id) => {
  const response = await api.post(`/${id}/confirmar-llegada`);
  return response.data;
};

export const cancelarReserva = async (id) => {
  const response = await api.post(`/${id}/cancelar`);
  return response.data;
};