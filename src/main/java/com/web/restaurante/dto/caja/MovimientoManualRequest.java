package com.web.restaurante.dto.caja;

import lombok.Data;

@Data
public class MovimientoManualRequest {
    private String tipo;      // "INGRESO" o "EGRESO"
    private String concepto;  // Descripción del movimiento (ej. "Pago de verduras")
    private Double monto;     // Monto del movimiento
}