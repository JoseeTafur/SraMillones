package com.web.restaurante.dto.login;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class LoginResponseDTO {

    private boolean success;
    private String message;
    private Long usuarioId;
    private String nombreUsuario;
    private String rol;
    private String empleadoNombre;
    private String turno;
    private Map<String, List<OpcionMenuDTO>> menuAgrupado;
    private List<OpcionMenuDTO> opcionesIndependientes;
}