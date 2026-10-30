package com.web.restaurante.dto.cliente;

public record ClienteSaveDTO(
        String nombre,
        String apellido,
        String dni,
        String telefono,
        String correo
) {
}
