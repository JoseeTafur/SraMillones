package com.web.restaurante.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "detalle_comanda")
public class DetalleComanda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_comanda", nullable = false)
    @JsonIgnore
    private Comanda comanda;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;
    
    @Column(name = "impreso_en_cocina")
    private Boolean impresoEnCocina = false;

    @Column(nullable = false)
    private boolean pagado = false;

    private int cantidad = 1;
    private Double precioUnitario;
    private Double subtotal;

    private boolean cocinado = true;
    private boolean entregado = true;
    private boolean canceladoPorCliente = false;

    @PrePersist
    @PreUpdate
    protected void calcularSubtotal() {
        if (this.precioUnitario == null && this.producto != null) {
            this.precioUnitario = this.producto.getPrecio();
        }
        if (this.precioUnitario != null) {
            this.subtotal = this.precioUnitario * this.cantidad;
        }
    }

    public boolean isImpresoEnCocina() {
        return Boolean.TRUE.equals(this.impresoEnCocina);
    }
}