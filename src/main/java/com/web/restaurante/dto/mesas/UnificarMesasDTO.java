package com.web.restaurante.dto.mesas;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class UnificarMesasDTO {
    @NotNull(message = "La mesa principal es obligatoria")
    private Long idMesaPrincipal;

    @NotEmpty(message = "Debe seleccionar al menos una mesa para agrupar")
    private List<Long> idsMesasHijas;
}