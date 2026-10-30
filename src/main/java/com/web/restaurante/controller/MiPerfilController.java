package com.web.restaurante.controller;

import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.service.EmpleadoService;
import com.web.restaurante.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/mi-perfil")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MiPerfilController {

    private final EmpleadoService empleadoService;
    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<?> verPerfil(HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        try {
            String username = null;
            Long usuarioId = null;
            String rol = "INVITADO";

            // 1. Intentar obtener datos desde el atributo 'datosSesion' (Map)
            Object datosSesionObj = session.getAttribute("datosSesion");
            if (datosSesionObj instanceof Map<?, ?> datos) {
                if (datos.get("username") != null) username = datos.get("username").toString();
                if (datos.get("nombreUsuario") != null) username = datos.get("nombreUsuario").toString();
                if (datos.get("usuario") != null) username = datos.get("usuario").toString();
                if (datos.get("rol") != null) rol = datos.get("rol").toString();
                if (datos.get("id") != null) {
                    try {
                        usuarioId = Long.parseLong(datos.get("id").toString());
                    } catch (Exception ignored) {}
                }
            }

            // 2. Fallbacks desde atributos directos de sesión
            if (username == null && session.getAttribute("username") != null) {
                username = session.getAttribute("username").toString();
            }
            if (username == null && session.getAttribute("usuario") != null) {
                username = session.getAttribute("usuario").toString();
            }
            if (session.getAttribute("rol") != null) {
                rol = session.getAttribute("rol").toString();
            }
            if (usuarioId == null && session.getAttribute("usuarioId") != null) {
                try {
                    usuarioId = Long.parseLong(session.getAttribute("usuarioId").toString());
                } catch (Exception ignored) {}
            }

            // 3. Validar si existe sesión identificada
            if (username == null && usuarioId == null) {
                response.put("success", false);
                response.put("message", "No hay una sesión activa de usuario.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("username", username != null ? username : "Usuario");
            data.put("rol", rol);
            data.put("estado", "Autenticado / Activo");

            // 4. Intentar vincular datos de Empleado
            Optional<Empleado> empOpt = Optional.empty();

            if (usuarioId != null) {
                Optional<Usuario> userOpt = usuarioService.obtenerPorId(usuarioId);
                if (userOpt.isPresent()) {
                    empOpt = empleadoService.obtenerPorUsuario(userOpt.get());
                }
            } else if (username != null) {
                Optional<Usuario> userOpt = usuarioService.encontrarPorUsuario(username);
                if (userOpt.isPresent()) {
                    empOpt = empleadoService.obtenerPorUsuario(userOpt.get());
                }
            }

            if (empOpt.isPresent()) {
                Empleado emp = empOpt.get();
                data.put("nombreCompleto", emp.getApellido() + ", " + emp.getNombre());
                data.put("dni", emp.getDni() != null ? emp.getDni() : "Sin DNI");
                data.put("telefono", emp.getTelefono() != null ? emp.getTelefono() : "Sin teléfono");
                data.put("turno", emp.getTurno() != null ? emp.getTurno() : "Único");
            } else {
                data.put("nombreCompleto", "Personal de SRA MILLONES");
                data.put("dni", "No registrado");
                data.put("telefono", "No registrado");
                data.put("turno", "Único");
            }

            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al procesar la información del perfil: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}