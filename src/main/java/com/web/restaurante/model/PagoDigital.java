package com.web.restaurante.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.SituacionPagoDigital;
import com.web.restaurante.model.enums.TipoPedido;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "pago_digital")
public class PagoDigital extends BaseEntidad {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_venta", nullable = true)
    @JsonIgnore
    private Venta venta;

    @Column(name = "cliente_nombre", length = 150)
    private String clienteNombre;

    @Column(name = "numero_operacion", length = 40)
    private String numeroOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", length = 30)
    private MetodoPago metodoPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_atencion", length = 30)
    private TipoPedido tipoAtencion;

    @Column(name = "monto_total")
    private Double montoTotal;

    @Column(name = "detalle_pedido_json", columnDefinition = "TEXT")
    private String detallePedidoJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaPago;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SituacionPagoDigital situacion = SituacionPagoDigital.PENDIENTE;

    private String observacion;

    private String imgUrl;
}