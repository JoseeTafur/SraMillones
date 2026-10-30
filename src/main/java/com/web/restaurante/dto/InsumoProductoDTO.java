package com.web.restaurante.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InsumoProductoDTO {

    private Long id;
    private Long idInsumo;
    private String nombreInsumo;
    private Long idProducto;
    private String nombreProducto;
    private String categoriaInsumo;
}