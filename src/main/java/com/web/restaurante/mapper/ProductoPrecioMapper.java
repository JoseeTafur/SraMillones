package com.web.restaurante.mapper;

import com.web.restaurante.dto.productoprecio.InsumoRefDTO;
import com.web.restaurante.dto.productoprecio.ProductoPrecioDTO;
import com.web.restaurante.model.InsumoProducto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductoPrecioMapper {

    @Mapping(source = "insumo.id", target = "id")
    @Mapping(source = "insumo.nombre", target = "nombre")
    InsumoRefDTO toDTORef(InsumoProducto insumoProducto);

//    @Mapping(source = "producto.id", target = "id")
//    ProductoPrecioDTO toDTO (InsumoProducto insumoProducto);
}
