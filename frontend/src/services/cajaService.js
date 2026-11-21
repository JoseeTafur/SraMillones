import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/caja`;

export const cajaService = {

  obtenerEstadoCaja: async () => {
    const res = await axios.get(`${API_BASE}/turno/estado`, { withCredentials: true });
    return res.data;
  },

  // Abrir turno (regular o forzado)
  abrirCaja: async (montoApertura, aperturaForzada = false) => {
    const res = await axios.post(
      `${API_BASE}/turno/abrir`,
      { 
        montoApertura: Number(montoApertura), 
        aperturaForzada: Boolean(aperturaForzada) 
      },
      { withCredentials: true }
    );
    return res.data;
  },

  // Cerrar turno con conteo físico y observaciones
  cerrarCaja: async (montoCierre, observaciones = '') => {
    const res = await axios.post(
      `${API_BASE}/turno/cerrar`,
      { montoCierre: parseFloat(montoCierre), observaciones },
      { withCredentials: true }
    );
    return res.data;
  },

  // Registrar movimiento manual (INGRESO o EGRESO)
  registrarMovimiento: async (tipo, concepto, monto) => {
    const res = await axios.post(
      `${API_BASE}/movimientos/registrar`,
      { tipo, concepto, monto: parseFloat(monto) },
      { withCredentials: true }
    );
    return res.data;
  },

  // Consultar historial de turnos cerrados
  obtenerHistorialTurnos: async (fechaInicio, fechaFin) => {
    const res = await axios.get(`${API_BASE}/auditoria/historial-turnos`, {
      params: { fechaInicio, fechaFin },
      withCredentials: true
    });
    return res.data;
  },

  obtenerComandasPorCobrar: async () => {
  const res = await axios.get(`${BASE_URL}/api/comandas/por-cobrar`, { withCredentials: true });
  return res.data;
},

cobrarComanda: async (comandaId, datosPago) => {
  const res = await axios.post(
    `${BASE_URL}/api/caja/turno/cobrar/${comandaId}`,
    datosPago,
    { withCredentials: true }
  );
  return res.data;
},

obtenerDetalleVenta: async (movimientoId) => {
    const res = await axios.get(`${BASE_URL}/api/caja/auditoria/venta-detalle/${movimientoId}`, {
      withCredentials: true
    });
    return res.data;
  },

  // 🟢 Consultar estado y movimientos de un turno histórico para la auditoría de Caja General
  obtenerEstadoCajaPorTurno: async (idTurno) => {
    const res = await axios.get(`${API_BASE}/auditoria/turno/${idTurno}`, {
      withCredentials: true
    });
    return res.data;
  },

  // 🟢 Alias por compatibilidad
  obtenerDetalleTurnoAuditoria: async (idTurno) => {
    const res = await axios.get(`${API_BASE}/auditoria/turno/${idTurno}`, {
      withCredentials: true
    });
    return res.data;
  },
};



export default cajaService;