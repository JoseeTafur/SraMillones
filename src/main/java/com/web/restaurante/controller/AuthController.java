package com.web.restaurante.controller;

import com.web.restaurante.dto.login.LoginRequestDTO;
import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request, HttpSession session) {
    LoginResponseDTO response = authService.autenticar(request);

    if (response.isSuccess()) {
        session.setAttribute("usuarioId", response.getUsuarioId());
        session.setAttribute("nombreUsuario", response.getNombreUsuario());
        session.setAttribute("rol", response.getRol());
        // 🟢 Asegurar que guardamos el objeto DTO completo en sesión
        session.setAttribute("datosSesion", response);
    }

        return ResponseEntity.ok(response);
    }

   @GetMapping("/me")
public ResponseEntity<?> obtenerUsuarioSesion(HttpSession session) {
    LoginResponseDTO response = (LoginResponseDTO) session.getAttribute("datosSesion");

    if (response == null) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", "No hay una sesión activa.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    return ResponseEntity.ok(response);
}

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Sesión cerrada correctamente.");
        return ResponseEntity.ok(response);
    }
}