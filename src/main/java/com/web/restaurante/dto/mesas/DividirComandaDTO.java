package com.web.restaurante.dto.mesas;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class DividirComandaDTO {
    @NotNull(message = "La mesa origen es obligatoria")
    private Long idMesaOrigen;

    @NotNull(message = "El número de mesa destino es obligatorio")
    private Integer numeroMesaDestino;

    @NotEmpty(message = "Debe seleccionar al menos un plato para trasladar")
    private List<Long> idsDetalles;
}