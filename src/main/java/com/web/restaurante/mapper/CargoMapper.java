package com.web.restaurante.mapper;

import com.web.restaurante.dto.cargo.CargoDTO;
import com.web.restaurante.model.Cargo;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CargoMapper {
    CargoDTO toDTO(Cargo cargo);
}
