package com.web.restaurante.mapper;

import com.web.restaurante.dto.sidebar.OpcionDTO;
import com.web.restaurante.model.Opcion;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OpcionMapper {
    OpcionDTO toDTO(Opcion opcion);

    List<OpcionDTO> listToDTO(List<Opcion> opciones);
}
