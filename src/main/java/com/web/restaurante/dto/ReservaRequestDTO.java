package com.web.restaurante.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReservaRequestDTO {

    @NotBlank(message = "El nombre del cliente no puede estar vacío")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "El nombre solo puede contener letras")
    private String nombreCliente;

    @NotBlank(message = "El teléfono no puede estar vacío")
    @Pattern(regexp = "^\\d{9}$", message = "El teléfono debe tener exactamente 9 dígitos")
    private String telefono;

    @Min(value = 1, message = "El número de personas debe ser mayor a 0")
    private int numeroPersonas;

    @NotNull(message = "La fecha y hora son obligatorias")
    @Future(message = "La fecha y hora no puede ser en el pasado")
    private LocalDateTime fechaHora;

    private String observacion;
}