package com.web.restaurante.dto.auth;

public record AuthPayloadDTO(
        Long id,
        String usuario,
        String perfil
) {
}
