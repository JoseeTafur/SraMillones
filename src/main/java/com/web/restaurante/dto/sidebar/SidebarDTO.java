package com.web.restaurante.dto.sidebar;

import java.util.List;

public record SidebarDTO(
        List<GrupoOpcionDTO> grupoOpciones,
        List<OpcionDTO> opciones
) {
}
