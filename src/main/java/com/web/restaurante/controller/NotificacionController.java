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
@RequestMapping("/admin/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionRepository notificacionRepository;

    private List<Notificacion> obtenerPendientesPorUsuario(Usuario user) {
        String perfil = user.getPerfil().getNombre().toUpperCase();
        if (perfil.contains("ADMIN") || perfil.contains("SUPER")) {
            return notificacionRepository.findByLeidoFalseOrderByFechaCreacionDesc();
        }
        if (perfil.contains("CAJERO") || perfil.contains("CAJA")) {
            return notificacionRepository.findByLeidoFalseAndDestinoPerfilInOrderByFechaCreacionDesc(
                    Arrays.asList("TODOS", "CAJERO", "CAJA")
            );
        }
        return notificacionRepository.findByLeidoFalseAndDestinoPerfilInOrderByFechaCreacionDesc(
                Arrays.asList("TODOS", perfil)
        );
    }

    @GetMapping("/api/listar-no-leidas")
    public ResponseEntity<?> obtenerAlertasActivasApi(HttpSession session) {
        Usuario user = (Usuario) session.getAttribute("usuarioLogueado");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        List<Notificacion> noLeidas = obtenerPendientesPorUsuario(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", noLeidas,
                "total", noLeidas.size(),
                "perfilActual", user.getPerfil().getNombre().toUpperCase()
        ));
    }

    @PostMapping("/api/marcar-leido-individual/{id}")
    public ResponseEntity<?> marcarLeidoIndividual(@PathVariable Long id) {
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
        Usuario user = (Usuario) session.getAttribute("usuarioLogueado");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        List<Notificacion> modificar = obtenerPendientesPorUsuario(user);
        modificar.forEach(n -> n.setLeido(true));
        notificacionRepository.saveAll(modificar);

        return ResponseEntity.ok(Map.of("success", true, "message", "Panel despejado"));
    }
}