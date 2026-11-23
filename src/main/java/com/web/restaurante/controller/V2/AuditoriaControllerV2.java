package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.service.AuditoriaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.API_V2_ADMIN + "/auditoria")
@RequiredArgsConstructor
public class AuditoriaControllerV2 {

    private final AuditoriaService auditoriaService;

    private boolean tieneSesionActiva(@AuthenticationPrincipal TokenUsuarioDTO session) {
        if (session == null) return false;
        return !(session.id() == null && session.usuario() == null && session.perfil() == null);
    }

    @GetMapping("/api/listar")
    public ResponseEntity<?> listarAuditoria(@AuthenticationPrincipal TokenUsuarioDTO session) {
        if (!tieneSesionActiva(session)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sesión inválida"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", auditoriaService.listarRecientes()
        ));
    }
}
