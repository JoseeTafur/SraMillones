package com.web.restaurante.dto.caja;

import lombok.Data;

@Data
public class AperturaCajaRequest {
    private Double montoApertura;      // Monto inicial customizable (ej. S/ 200.00)
    private Boolean aperturaForzada;    // true si el Administrador autoriza abrir fuera de horario
}