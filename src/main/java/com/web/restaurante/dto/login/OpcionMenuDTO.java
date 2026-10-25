package com.web.restaurante.dto.login;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OpcionMenuDTO {
    private Long id;
    private String nombre;
    private String ruta;
    private String icono;
}