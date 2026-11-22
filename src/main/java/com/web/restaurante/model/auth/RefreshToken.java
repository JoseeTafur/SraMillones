package com.web.restaurante.model.auth;

import com.web.restaurante.model.BaseEntidad;
import com.web.restaurante.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class RefreshToken extends BaseEntidad {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(unique = true, nullable = false, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiracion;

    @Column(nullable = false)
    private boolean revocado;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @PrePersist
    protected void onCreate() {
        creadoEn = Instant.now();
    }

}
