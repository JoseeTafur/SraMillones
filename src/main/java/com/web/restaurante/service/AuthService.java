package com.web.restaurante.service;

import com.web.restaurante.dto.login.LoginRequestDTO;
import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.dto.login.OpcionMenuDTO;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Opcion;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoService empleadoService;
    private final PasswordEncoder passwordEncoder; // O tu método de validación de contraseñas

    @Transactional(readOnly = true)
    public LoginResponseDTO autenticar(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByUsuario(request.getUsuario())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        if (usuario.getEstado() != 1) {
            throw new IllegalStateException("El usuario se encuentra inactivo.");
        }

        // Validación de contraseña segura
        if (!passwordEncoder.matches(request.getClave(), usuario.getClave())) {
            throw new IllegalArgumentException("Contraseña incorrecta.");
        }

        // Determinar rol efectivo
        Optional<Empleado> empOpt = empleadoService.obtenerPorUsuario(usuario);
        String rol = calcularRolEfectivo(usuario, empOpt);

        // Generar estructura de menús
        List<Opcion> opcionesPermitidas = filtrarOpcionesPorRol(usuario, rol);
        Map<String, List<OpcionMenuDTO>> menuAgrupado = new LinkedHashMap<>();
        List<OpcionMenuDTO> independientes = new ArrayList<>();

        agruparMenu(opcionesPermitidas, menuAgrupado, independientes);

        return LoginResponseDTO.builder()
                .success(true)
                .message("Autenticación exitosa")
                .usuarioId(usuario.getId())
                .nombreUsuario(usuario.getUsuario())
                .rol(rol)
                .empleadoNombre(empOpt.map(Empleado::getNombre).orElse(usuario.getUsuario()))
                .turno(empOpt.map(e -> e.getTurno() != null ? e.getTurno().toUpperCase().trim() : "DIA").orElse("DIA"))
                .menuAgrupado(menuAgrupado)
                .opcionesIndependientes(independientes)
                .build();
    }

    private String calcularRolEfectivo(Usuario usuario, Optional<Empleado> empOpt) {
        String perfilNombre = usuario.getPerfil().getNombre().toUpperCase();

        if (perfilNombre.contains("SUPER_ADMIN")) return "SUPER_ADMIN";
        if (perfilNombre.contains("ADMIN")) return "ADMIN";

        if (empOpt.isPresent()) {
            String cargo = empOpt.get().getCargo().getNombre().toUpperCase();
            if (cargo.contains("REPARTIDOR")) return "REPARTIDOR";
            if (cargo.contains("COCINA") || cargo.contains("COCINERO")) return "COCINA";
            if (cargo.contains("CAJA") || cargo.contains("CAJERO")) return "CAJERO";
            if (cargo.contains("MESERO")) return "MESERO";
            if (cargo.contains("CONTADOR")) return "CONTADOR";
        }

        return perfilNombre;
    }

    private List<Opcion> filtrarOpcionesPorRol(Usuario usuario, String rol) {
        List<Opcion> todas = usuario.getPerfil().getOpciones().stream()
                .sorted(Comparator.comparing(Opcion::getId))
                .collect(Collectors.toList());

        if ("ADMIN".equals(rol) || "SUPER_ADMIN".equals(rol)) return todas;

        return todas.stream().filter(op -> {
            String ruta = op.getRuta();
            switch (rol) {
                case "MESERO":
                    return ruta.equals("/dashboard") || ruta.contains("/mesas") || ruta.contains("/comandera");
                case "COCINA":
                    return ruta.equals("/dashboard") || ruta.contains("/cocina");
                case "CAJERO":
                    return ruta.equals("/dashboard") || ruta.contains("/caja") || ruta.contains("/reservas") || ruta.contains("/despacho");
                case "REPARTIDOR":
                    return ruta.equals("/dashboard") || ruta.contains("/entregas");
                case "CONTADOR":
                    return ruta.equals("/dashboard") || ruta.contains("/comprobantes");
                default:
                    return ruta.equals("/dashboard") || ruta.contains("/MiPerfil");
            }
        }).collect(Collectors.toList());
    }

    private void agruparMenu(List<Opcion> opciones, Map<String, List<OpcionMenuDTO>> menuAgrupado, List<OpcionMenuDTO> independientes) {
        for (Opcion op : opciones) {
            OpcionMenuDTO dto = new OpcionMenuDTO(op.getId(), op.getNombre(), op.getRuta(), op.getIcono());
            String ruta = op.getRuta();

            if (ruta.contains("/cocina")) {
                menuAgrupado.computeIfAbsent("Cocina", k -> new ArrayList<>()).add(dto);
            } else if (ruta.contains("/mesas") || ruta.contains("/comandera")) {
                menuAgrupado.computeIfAbsent("Salón", k -> new ArrayList<>()).add(dto);
            } else if (ruta.contains("/reservas") || ruta.contains("/caja")) {
                menuAgrupado.computeIfAbsent("Caja & Reservas", k -> new ArrayList<>()).add(dto);
            } else {
                independientes.add(dto);
            }
        }
    }
}