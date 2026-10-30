package com.web.restaurante.dto.mesas;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class LiquidarMultiticketDTO {
    @NotNull(message = "El ID de la mesa es obligatorio")
    private Long mesaId;

    private List<TicketDTO> listaTickets;
    private List<Long> idsDetallesPagados;
}