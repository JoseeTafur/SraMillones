package com.web.restaurante.mapper;

import com.web.restaurante.dto.empleado.EmpleadoDTO;
import com.web.restaurante.model.Empleado;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = CargoMapper.class)
public interface EmpleadoMapper {
    EmpleadoDTO toDTO(Empleado empleado);
}
