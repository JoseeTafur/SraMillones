package com.web.restaurante.dto.empleado;

import com.web.restaurante.dto.cargo.CargoDTO;
import com.web.restaurante.dto.usuario.UsuarioDTO;

import java.time.LocalDate;

public record EmpleadoDTO(
        Long id,
        String nombre,
        String apellido,
        String dni,
        String telefono,
        String turno,
        LocalDate fechaIngreso,
        CargoDTO cargoDTO,
        Integer estado,
        UsuarioDTO usuario
) {
}
