package com.web.restaurante.controller;

import com.web.restaurante.model.Usuario;
import com.web.restaurante.service.AuditoriaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    @GetMapping("/api/listar")
    public ResponseEntity<?> listarAuditoria(HttpSession session) {
        Usuario user = (Usuario) session.getAttribute("usuarioLogueado");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        String perfil = user.getPerfil().getNombre().toUpperCase();
        if (!perfil.contains("ADMIN") && !perfil.contains("SUPER")) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Acceso restringido a administradores"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", auditoriaService.listarRecientes()
        ));
    }
}