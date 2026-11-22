package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.service.PerfilService;
import com.web.restaurante.service.UsuarioService;
import com.web.restaurante.util.ResponseUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping(ApiRoutes.API_V2 + "/usuarios")
@RequiredArgsConstructor
public class UsuariosControllerV2 {

    private final UsuarioService usuarioService;
    private final PerfilService perfilService;

    @GetMapping
    public ResponseEntity<?> listarUsuarios() {
        return ResponseUtil.ok(usuarioService.listar());
    }

    @GetMapping("/perfiles")
    public ResponseEntity<?> listarPerfiles() {
        return ResponseUtil.ok(perfilService.listar());
    }

    @GetMapping("/rol-sesion")
    public ResponseEntity<?> getRolSesion(@AuthenticationPrincipal TokenUsuarioDTO usuario) {
        return ResponseUtil.ok(usuarioService.resolverRol(usuario));
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarUsuarioAjax(@RequestBody Usuario usuario, BindingResult bindingResult) {
        Map<String, Object> response = new HashMap<>();

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Datos inválidos en el formulario."));
        }

        try {

            if (usuario.getId() != null) {
                Usuario existente = usuarioService.obtenerPorId(usuario.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en el sistema."));

                if (usuario.getPerfil() == null || usuario.getPerfil().getId() == null) {
                    usuario.setPerfil(existente.getPerfil());
                }
            }

            if (usuario.getId() != null && (usuario.getClave() == null || usuario.getClave().trim().isEmpty())) {
                usuario.setClave(null);
            }

            Usuario usuarioGuardado = usuarioService.guardar(usuario);

            response.put("success", true);
            response.put("usuario", usuarioGuardado);
            response.put("message", usuario.getId() != null ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/obtener/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        return ResponseUtil.ok(usuarioService.obtenerPorId(id));
    }

    @PostMapping("/cambiar-estado/{id}")
    public ResponseEntity<?> cambiarEstadoUsuarioAjax(@PathVariable Long id, TokenUsuarioDTO session) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long idSesion = usuarioService.obtenerIdDeSesion(session);
            String rolSesion = usuarioService.resolverRol(session);

            if (Objects.equals(idSesion, id)) {
                response.put("success", false);
                response.put("message", "Operación no permitida: No puedes desactivar tu propia cuenta.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            Usuario objetivo = usuarioService.obtenerPorId(id).orElse(null);
            if (objetivo != null && objetivo.getPerfil() != null) {
                String perfilObjetivo = objetivo.getPerfil().getNombre().toUpperCase().replace(" ", "_");
                if ((perfilObjetivo.contains("ADMIN") || perfilObjetivo.contains("ADMINISTRADOR")) && !"SUPER_ADMIN".equals(rolSesion)) {
                    response.put("success", false);
                    response.put("message", "Operación denegada: Solo el Super Admin del restaurante puede suspender cuentas administradoras.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }

            Usuario usuario = usuarioService.alternarEstado(id);
            if (usuario != null) {
                response.put("success", true);
                response.put("message", "Estado del usuario actualizado correctamente");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Usuario no encontrado en la base de datos.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar estado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarUsuarioAjax(@PathVariable Long id, @AuthenticationPrincipal TokenUsuarioDTO session) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long idSesion = usuarioService.obtenerIdDeSesion(session);
            String rolSesion = usuarioService.resolverRol(session);

            Usuario objetivo = usuarioService.obtenerPorId(id).orElse(null);
            if (objetivo == null) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            if (Objects.equals(idSesion, id)) {
                response.put("success", false);
                response.put("message", "Operación inválida: No puedes eliminar la cuenta con la que estás firmado.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            if (objetivo.getPerfil() != null) {
                String perfilObjetivo = objetivo.getPerfil().getNombre().toUpperCase().replace(" ", "_");

                if (perfilObjetivo.contains("SUPER_ADMIN")) {
                    response.put("success", false);
                    response.put("message", "Violación de jerarquía: La cuenta maestra SUPER_ADMIN es inmutable y no puede ser removida.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }

                if ((perfilObjetivo.contains("ADMIN") || perfilObjetivo.contains("ADMINISTRADOR")) && !"SUPER_ADMIN".equals(rolSesion)) {
                    response.put("success", false);
                    response.put("message", "Operación denegada: Solo el rango SUPER_ADMIN posee privilegios para purgar cuentas administradoras.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }

            usuarioService.eliminar(id);
            response.put("success", true);
            response.put("message", "Usuario eliminado correctamente de los registros.");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error interno del servidor al eliminar el usuario.");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
