package com.web.restaurante.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones_sistema")
@Data
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String mensaje;

    @Column(nullable = false, length = 30)
    private String tipo; // PAGO_DIGITAL, CAJA, STOCK, SISTEMA

    @Column(nullable = false, length = 40)
    private String destinoPerfil; // ADMIN, CAJERO, COCINA, MESERO, TODOS

    @Column(length = 120)
    private String rutaDestino; // Ej: "/admin/pagos-digitales"

    private Long idReferencia; // Ej: id del PagoDigital para auto-marcar leído al aprobar/denegar

    private boolean leido = false;
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}