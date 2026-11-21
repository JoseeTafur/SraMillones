// PagoDigitalMapper.java
package com.web.restaurante.mapper;

import com.web.restaurante.dto.pago.PagoDigitalDTO;
import com.web.restaurante.model.PagoDigital;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PagoDigitalMapper {

    @Mapping(source = "venta.id", target = "idVenta")
    @Mapping(source = "venta.numeroComprobante", target = "numeroComprobante")
    PagoDigitalDTO toDTO(PagoDigital pagoDigital);
}