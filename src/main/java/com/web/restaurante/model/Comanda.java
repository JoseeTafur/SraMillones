package com.web.restaurante.model;

import com.web.restaurante.model.enums.EstadoComanda;
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
@Table(name = "comanda")
public class Comanda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_mesa", nullable = false)
    private Integer numeroMesa;

    private LocalDateTime fechaApertura;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 30)
    private EstadoComanda estado;

    @Column(length = 500)
    private String observaciones;

    private boolean ticketImpresoCocina = false;

    @OneToMany(mappedBy = "comanda", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<DetalleComanda> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaApertura = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoComanda.EN_COCINA;
        }
    }

    public void agregarDetalle(DetalleComanda detalle) {
        detalles.add(detalle);
        detalle.setComanda(this);
    }

    public void removerDetalle(DetalleComanda detalle) {
        detalles.remove(detalle);
        detalle.setComanda(null);
    }

    public double getMontoTotal() {
        if (detalles == null || detalles.isEmpty()) return 0.0;
        return detalles.stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .mapToDouble(DetalleComanda::getSubtotal)
                .sum();
    }
}