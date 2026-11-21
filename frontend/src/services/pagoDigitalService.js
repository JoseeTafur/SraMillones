import api from './api';

// Nota: PagoDigitalController tiene @RequestMapping("/admin/pagos-digitales") sin /api al inicio
// Ajustamos la base relativa o URL completa según tu VITE_API_BASE_URL
const BASE_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const PAGOS_URL = `${BASE_HOST}/admin/pagos-digitales/api`;

export const pagoDigitalService = {
  listarTodos: async () => {
    const { data } = await api.get(`${PAGOS_URL}/listar`);
    return data.data || [];
  },

  aprobarPago: async (id, observacion) => {
    const { data } = await api.patch(`${PAGOS_URL}/aprobar/${id}`, {
      observacion: observacion || 'Pago verificado y aprobado en caja.',
    });
    return data;
  },

  anularPago: async (id, observacion) => {
    const { data } = await api.patch(`${PAGOS_URL}/anular/${id}`, {
      observacion: observacion || 'Comprobante rechazado / pago no recibido.',
    });
    return data;
  },
};