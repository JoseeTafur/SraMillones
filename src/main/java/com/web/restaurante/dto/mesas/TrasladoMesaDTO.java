package com.web.restaurante.dto.mesas;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TrasladoMesaDTO {
    @NotNull(message = "La mesa origen es obligatoria")
    private Long idMesaOrigen;

    @NotNull(message = "La mesa destino es obligatoria")
    private Long idMesaDestino;
}