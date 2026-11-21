package com.web.restaurante.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_eventos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime fechaHora;

    private Long idUsuario;

    @Column(nullable = false, length = 120)
    private String usuarioNombre;

    @Column(nullable = false, length = 60)
    private String rolUsuario;

    @Column(nullable = false, length = 50)
    private String modulo; // PAGOS_DIGITALES, CAJA, VENTAS, ROLES, PRODUCTOS

    @Column(nullable = false, length = 60)
    private String accion; // APROBAR_PAGO, DENEGAR_PAGO, APERTURA_CAJA, CIERRE_CAJA, CAMBIO_PERMISOS

    @Column(length = 60)
    private String entidad; // PagoDigital, Venta, TurnoCaja, Perfil

    private Long idEntidad;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(columnDefinition = "TEXT")
    private String datosAntes;

    @Column(columnDefinition = "TEXT")
    private String datosDespues;
}