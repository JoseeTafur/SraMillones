package com.web.restaurante.model.embeddable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.web.restaurante.model.Empleado;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Embeddable
@Getter
@Setter
public class DatosDelivery {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_repartidor")
    @JsonIgnoreProperties("pedidos")
    private Empleado repartidor;

    @Column(name = "direccion_entrega")
    private String direccion;

    private Double latitud;
    private Double longitud;

    private LocalDateTime fechaSalida;
}