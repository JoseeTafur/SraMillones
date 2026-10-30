package com.web.restaurante.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.TipoPedido;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "venta")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_comprobante", length = 30)
    private String numeroComprobante; // Serie y correlativo (ej. NV-0001 o B001-0012)

    @Column(name = "tipo_comprobante", length = 20)
    private String tipoComprobante; // "BOLETA", "FACTURA", "NOTA_VENTA"

    @Column(name = "cliente_nombre", nullable = false)
    private String clienteNombre = "PÚBLICO GENERAL";

    @Column(name = "documento_cliente", length = 15)
    private String documentoCliente;

    @Column(name = "numero_mesa")
    private Integer numeroMesa;

    private LocalDateTime fechaVenta;

    private Double montoTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago")
    private MetodoPago metodoPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", length = 20)
    private EstadoPago estadoPago = EstadoPago.PAGADO;

    @Enumerated(EnumType.STRING)
    private TipoPedido tipoAtencion; // SALON, DELIVERY, LLEVAR

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_turno_caja")
    @JsonIgnoreProperties({"movimientos", "ventas"})
    private TurnoCaja turnoCaja;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<DetalleVenta> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaVenta = LocalDateTime.now();
        if (this.clienteNombre == null || this.clienteNombre.trim().isEmpty()) {
            this.clienteNombre = "PÚBLICO GENERAL";
        }
    }
}