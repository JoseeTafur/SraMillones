import api from './api';

const API_URL = `/v2/admin/pagos-digitales`;

export const pagoDigitalService = {
  listarTodos: async () => {
    const { data } = await api.get(`${API_URL}/listar`);
    return data.data || [];
  },

  aprobarPago: async (id, observacion) => {
    const { data } = await api.patch(`${API_URL}/aprobar/${id}`, {
      observacion: observacion || 'Pago verificado y aprobado en caja.',
    });
    return data;
  },

  anularPago: async (id, observacion) => {
    const { data } = await api.patch(`${API_URL}/anular/${id}`, {
      observacion: observacion || 'Comprobante rechazado / pago no recibido.',
    });
    return data;
  },
};