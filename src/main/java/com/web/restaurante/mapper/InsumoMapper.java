package com.web.restaurante.mapper;

import com.web.restaurante.dto.InsumoDTO;
import com.web.restaurante.dto.InsumoProductoDTO;
import com.web.restaurante.model.Insumo;
import com.web.restaurante.model.InsumoProducto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InsumoMapper {

    InsumoDTO toDTO(Insumo insumo);
    Insumo toEntity(InsumoDTO dto);

    @Mapping(source = "insumo.id", target = "idInsumo")
    @Mapping(source = "insumo.nombre", target = "nombreInsumo")
    @Mapping(source = "producto.id", target = "idProducto")
    @Mapping(source = "producto.nombre", target = "nombreProducto")
    @Mapping(source = "insumo.categoria", target = "categoriaInsumo")
    InsumoProductoDTO toDTODetalle(InsumoProducto insumoProducto);
}