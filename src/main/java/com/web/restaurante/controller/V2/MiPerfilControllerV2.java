package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.service.EmpleadoService;
import com.web.restaurante.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(ApiRoutes.API_V2 + "/mi-perfil")
@RequiredArgsConstructor
public class MiPerfilControllerV2 {

    private final EmpleadoService empleadoService;
    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<?> verPerfil(@AuthenticationPrincipal TokenUsuarioDTO session) {
        Map<String, Object> response = new HashMap<>();

        try {
            String username = session.usuario();
            Long usuarioId = session.id();
            String rol = session.perfil().toUpperCase();

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
