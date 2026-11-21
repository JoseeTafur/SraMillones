package com.web.restaurante.controller;

import com.web.restaurante.service.AuditoriaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    private boolean tieneSesionActiva(HttpSession session) {
        if (session == null) return false;
        return session.getAttribute("usuarioLogueado") != null
                || session.getAttribute("datosSesion") != null
                || session.getAttribute("usuarioId") != null;
    }

    @GetMapping("/api/listar")
    public ResponseEntity<?> listarAuditoria(HttpSession session) {
        if (!tieneSesionActiva(session)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", auditoriaService.listarRecientes()
        ));
    }
}