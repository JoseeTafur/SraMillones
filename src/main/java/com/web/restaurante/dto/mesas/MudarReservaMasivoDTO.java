package com.web.restaurante.dto.mesas;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class MudarReservaMasivoDTO {
    @NotEmpty(message = "Debe enviar al menos una mesa para trasladar a reservas")
    private List<Long> idsMesas;
}