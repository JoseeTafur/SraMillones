package com.web.restaurante.dto.cargo;

public record CargoDTO(
        Long id,
        String nombre,
        String descripcion,
        Integer estado
) {
}
