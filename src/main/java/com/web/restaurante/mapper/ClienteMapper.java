package com.web.restaurante.mapper;

import com.web.restaurante.dto.cliente.ClienteDTO;
import com.web.restaurante.dto.cliente.ClienteSelectDTO;
import com.web.restaurante.model.Cliente;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ClienteMapper {
    ClienteDTO toDTO(Cliente cliente);

    @Mapping(target = "value", source = "id")
    @Mapping(target = "label", source = ".", qualifiedByName = "generarEtiqueta")
    ClienteSelectDTO toSelectDTO(Cliente cliente);

    @Named("generarEtiqueta")
    default String generarEtiqueta(Cliente cliente) {
        return String.format("%s %s (%s)", cliente.getNombre(), cliente.getApellido(), cliente.getDni());
    }

}
