package com.web.restaurante.dto.cocina;

import com.web.restaurante.model.DetallePedido;
import com.web.restaurante.model.Pedido;
import lombok.Data;
import java.util.List;

@Data
public class TicketCocinaResponseDTO {
    private Long pedidoId;
    private String numeroMesa;
    private String tipoCocina;
    private String estadoPedido;
    private List<DetallePedido> detalles;

    public TicketCocinaResponseDTO(Pedido pedido, List<DetallePedido> detalles, String tipoCocina) {
        this.pedidoId = pedido.getId();
        this.numeroMesa = pedido.getNumeroMesa() != null ? "Mesa N° " + pedido.getNumeroMesa() : "Carta/Delivery";
        this.tipoCocina = tipoCocina.toUpperCase();
        this.estadoPedido = pedido.getEstado().toString();
        this.detalles = detalles;
    }
}
