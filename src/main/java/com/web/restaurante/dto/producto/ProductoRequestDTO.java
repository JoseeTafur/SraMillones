package com.web.restaurante.dto.producto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductoRequestDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private Double precio;
    private Long categoriaId;
    private MultipartFile archivoImagen;
    private String imagen;
    private Boolean eliminarImagen;
}