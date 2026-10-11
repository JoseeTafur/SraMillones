package com.web.restaurante.dto.productoprecio;

import java.util.List;

public record ProductoPrecioDTO(
        Long id,
        String imgUrl,
        String nombre,
        Double precio,
        List<InsumoRefDTO> insumos
) {
}
