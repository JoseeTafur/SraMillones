package com.web.restaurante.dto.auth;

public record MeDTO(
    Long id,
    String usuario,
    String nombre,
    String perfil
) {
}
