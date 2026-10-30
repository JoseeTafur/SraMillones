package com.web.restaurante.dto.caja;

import lombok.Data;

@Data
public class CierreCajaRequest {
    private Double montoCierre;        // Arqueo físico digitado por el cajero
    private String observaciones;      // Comentarios u observaciones del turno
}