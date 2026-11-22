package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.auth.AuthRequestDTO;
import com.web.restaurante.dto.auth.AuthResponseDTO;
import com.web.restaurante.dto.auth.AuthTokensDTO;
import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.service.AuthenticationService;
import com.web.restaurante.util.CookieUtil;
import com.web.restaurante.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiRoutes.API_V2 + "/auth")
@RequiredArgsConstructor
public class AuthControllerV2 {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO dto) {
        AuthTokensDTO tokens = authenticationService.login(dto);

        ResponseCookie cookie = CookieUtil.crear(
                tokens.refreshToken(),
                7 * 24 * 60 * 60
        );

        AuthResponseDTO response = new AuthResponseDTO(
                tokens.accessToken(), authenticationService.getPayload(tokens.accessToken()));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ResponseUtil.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal TokenUsuarioDTO dto) {
        return ResponseUtil.ok(dto);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseUtil.noAutorizado("Refresh Token no encontrado");
        }

        AuthTokensDTO tokens = authenticationService.refresh(refreshToken);

        ResponseCookie cookie = CookieUtil.crear(
                tokens.refreshToken(),
                7 * 24 * 60 * 60
        );

        AuthResponseDTO response = new AuthResponseDTO(
                tokens.accessToken(), authenticationService.getPayload(tokens.accessToken())
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ResponseUtil.ok(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(
                    name = "refreshToken",
                    required = false
            ) String refreshToken
    ) {
        ResponseCookie cookie = CookieUtil.eliminar();

        if (refreshToken != null && !refreshToken.isBlank()) {
            authenticationService.logout(refreshToken);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ResponseUtil.ok("Sesión cerrada correctamente"));
    }
}
