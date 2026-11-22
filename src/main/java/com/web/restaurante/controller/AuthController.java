package com.web.restaurante.controller;

import com.web.restaurante.dto.auth.AuthRequestDTO;
import com.web.restaurante.dto.auth.AuthResponseDTO;
import com.web.restaurante.dto.auth.AuthTokensDTO;
import com.web.restaurante.dto.auth.MeDTO;
import com.web.restaurante.dto.login.LoginRequestDTO;
import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.service.AuthService;
import com.web.restaurante.service.AuthenticationService;
import com.web.restaurante.util.CookieUtil;
import com.web.restaurante.util.ResponseUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationService authenticationService;

//    @PostMapping("/login")
//    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request, HttpSession session) {
//        LoginResponseDTO response = authService.autenticar(request);
//
//        if (response.isSuccess()) {
//            session.setAttribute("usuarioId", response.getUsuarioId());
//            session.setAttribute("nombreUsuario", response.getNombreUsuario());
//            session.setAttribute("rol", response.getRol());
//            // 🟢 Asegurar que guardamos el objeto DTO completo en sesión
//            session.setAttribute("datosSesion", response);
//        }
//
//        return ResponseEntity.ok(response);
//    }

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

//    @GetMapping("/me")
//    public ResponseEntity<?> obtenerUsuarioSesion(HttpSession session) {
//        LoginResponseDTO response = (LoginResponseDTO) session.getAttribute("datosSesion");
//
//        if (response == null) {
//            Map<String, Object> error = new HashMap<>();
//            error.put("success", false);
//            error.put("message", "No hay una sesión activa.");
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
//        }
//
//        return ResponseEntity.ok(response);
//    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal TokenUsuarioDTO dto) {
        return ResponseUtil.ok(dto);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtil.error("Refresh Token no encontrado"));
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

//    @PostMapping("/logout")
//    public ResponseEntity<?> logout(HttpSession session) {
//        session.invalidate();
//        Map<String, Object> response = new HashMap<>();
//        response.put("success", true);
//        response.put("message", "Sesión cerrada correctamente.");
//        return ResponseEntity.ok(response);
//    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(
                    name = "refreshToken",
                    required = false
            ) String refreshToken
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            authenticationService.logout(refreshToken);
        }

        ResponseCookie cookie = CookieUtil.eliminar();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ResponseUtil.ok("Sesión cerrada correctamente"));
    }

}