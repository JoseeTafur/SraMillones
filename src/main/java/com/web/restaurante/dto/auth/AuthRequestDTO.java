package com.web.restaurante.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthRequestDTO(
        @NotBlank(message = "El usuario o correo es obligatorio")
        String identificador,

        @NotBlank(message = "Debe ingresar una contraseña")
        String clave
) {
}
