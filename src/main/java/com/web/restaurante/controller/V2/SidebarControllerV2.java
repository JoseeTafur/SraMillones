package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.service.SidebarService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiRoutes.API_V2 + "/sidebar")
@RequiredArgsConstructor
public class SidebarControllerV2 {

    private final SidebarService sidebarService;

    @GetMapping
    public ResponseEntity<?> obtenerSidebar(@AuthenticationPrincipal TokenUsuarioDTO usuario) {
        return ResponseUtil.ok(sidebarService.generarSidebar(usuario.perfil()));
    }
}
