import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth`;

export const loginBackend = async (usuario, clave) => {
  const response = await axios.post(`${API_URL}/login`, { usuario, clave });
  return response.data;
};