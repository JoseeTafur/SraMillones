// PagoDigitalDTO.java
package com.web.restaurante.dto.pago;

import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.SituacionPagoDigital;
import com.web.restaurante.model.enums.TipoPedido;
import java.time.LocalDateTime;

public record PagoDigitalDTO(
        Long id,
        Long idVenta,
        String clienteNombre,
        String numeroOperacion,
        Double montoTotal,
        MetodoPago metodoPago,
        TipoPedido tipoAtencion,
        String numeroComprobante,
        String detallePedidoJson,
        LocalDateTime fechaPago,
        SituacionPagoDigital situacion,
        String observacion,
        String imgUrl
) {}