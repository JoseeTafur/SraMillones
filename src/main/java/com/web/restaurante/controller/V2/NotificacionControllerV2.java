package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.model.Notificacion;
import com.web.restaurante.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.API_V2 + "/notificaciones")
@RequiredArgsConstructor
public class NotificacionControllerV2 {

    private final NotificacionRepository notificacionRepository;

    private boolean tieneSesionActiva(@AuthenticationPrincipal TokenUsuarioDTO session) {
        if (session == null) return false;
        return !(session.id() == null && session.usuario() == null && session.perfil() == null);
    }

    private String resolverPerfilSesion(@AuthenticationPrincipal TokenUsuarioDTO session) {
        if (session == null) return "TODOS";
        if (session.perfil() != null) {
            return session.perfil().toUpperCase();
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

    @GetMapping("/listar-no-leidas")
    public ResponseEntity<?> obtenerAlertasActivasApi(@AuthenticationPrincipal TokenUsuarioDTO session) {
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

    @PostMapping("/marcar-leido-individual/{id}")
    public ResponseEntity<?> marcarLeidoIndividual(@PathVariable Long id, @AuthenticationPrincipal TokenUsuarioDTO session) {
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
    public ResponseEntity<?> marcarTodoComoLeido(@AuthenticationPrincipal TokenUsuarioDTO session) {
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
