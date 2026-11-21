package com.web.restaurante.controller;

import com.web.restaurante.model.Notificacion;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.repository.NotificacionRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionRepository notificacionRepository;

    private boolean tieneSesionActiva(HttpSession session) {
        if (session == null) return false;
        return session.getAttribute("usuarioLogueado") != null
                || session.getAttribute("datosSesion") != null
                || session.getAttribute("usuarioId") != null;
    }

    private String resolverPerfilSesion(HttpSession session) {
        if (session == null) return "TODOS";
        if (session.getAttribute("usuarioLogueado") instanceof Usuario u && u.getPerfil() != null) {
            return u.getPerfil().getNombre().toUpperCase();
        }
        Object datos = session.getAttribute("datosSesion");
        if (datos != null) {
            try {
                var m = datos.getClass().getMethod("getRol");
                Object rol = m.invoke(datos);
                if (rol != null && !rol.toString().isBlank()) {
                    return rol.toString().toUpperCase();
                }
            } catch (Exception ignored) {
            }
        }
        return "TODOS";
    }

    private List<Notificacion> obtenerPendientesPorPerfil(String perfil) {
        String p = perfil != null ? perfil.toUpperCase() : "TODOS";
        if (p.contains("ADMIN") || p.contains("SUPER")) {
            return notificacionRepository.findByLeidoFalseOrderByFechaCreacionDesc();
        }
        if (p.contains("CAJERO") || p.contains("CAJA")) {
            return notificacionRepository.findByLeidoFalseAndDestinoPerfilInOrderByFechaCreacionDesc(
                    Arrays.asList("TODOS", "CAJERO", "CAJA")
            );
        }
        return notificacionRepository.findByLeidoFalseAndDestinoPerfilInOrderByFechaCreacionDesc(
                Arrays.asList("TODOS", p)
        );
    }

    @GetMapping("/api/listar-no-leidas")
    public ResponseEntity<?> obtenerAlertasActivasApi(HttpSession session) {
        if (!tieneSesionActiva(session)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        String perfil = resolverPerfilSesion(session);
        List<Notificacion> noLeidas = obtenerPendientesPorPerfil(perfil);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", noLeidas,
                "total", noLeidas.size(),
                "perfilActual", perfil
        ));
    }

    @PostMapping("/api/marcar-leido-individual/{id}")
    public ResponseEntity<?> marcarLeidoIndividual(@PathVariable Long id, HttpSession session) {
        if (!tieneSesionActiva(session)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        return notificacionRepository.findById(id)
                .map(n -> {
                    n.setLeido(true);
                    notificacionRepository.save(n);
                    return ResponseEntity.ok(Map.of("success", true, "message", "Notificación archivada"));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("success", false, "message", "No encontrada")));
    }

    @PostMapping("/api/marcar-leido")
    public ResponseEntity<?> marcarTodoComoLeido(HttpSession session) {
        if (!tieneSesionActiva(session)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        String perfil = resolverPerfilSesion(session);
        List<Notificacion> modificar = obtenerPendientesPorPerfil(perfil);
        modificar.forEach(n -> n.setLeido(true));
        notificacionRepository.saveAll(modificar);

        return ResponseEntity.ok(Map.of("success", true, "message", "Panel despejado"));
    }
}