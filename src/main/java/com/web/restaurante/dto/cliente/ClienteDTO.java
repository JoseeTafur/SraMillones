package com.web.restaurante.dto.cliente;

public record ClienteDTO(
        Long id,
        String nombre,
        String apellido,
        String dni,
        String telefono,
        String correo,
        String direccion,
        Integer estado
) {
}
