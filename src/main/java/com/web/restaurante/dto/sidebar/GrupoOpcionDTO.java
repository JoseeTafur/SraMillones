package com.web.restaurante.dto.sidebar;

import java.util.List;

public record GrupoOpcionDTO(
        String nombre,
        String icono,
        Integer orden,
        String codigo,
        List<OpcionDTO> opciones
) {
}
