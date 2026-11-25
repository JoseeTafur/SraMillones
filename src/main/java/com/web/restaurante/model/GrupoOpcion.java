package com.web.restaurante.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grupo_opcion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GrupoOpcion extends BaseEntidad {

    @Column(nullable = false)
    private String nombre;

    private Integer orden;

    private String icono;

    private String codigo;
}
