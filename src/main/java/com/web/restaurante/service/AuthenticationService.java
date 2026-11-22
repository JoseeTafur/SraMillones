package com.web.restaurante.service;

import com.web.restaurante.dto.auth.*;
import com.web.restaurante.exception.CredencialesInvalidasException;
import com.web.restaurante.exception.RecursoNoEncontradoException;
import com.web.restaurante.mapper.UsuarioMapper;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthTokensDTO login(AuthRequestDTO dto) {
        Usuario usuario = usuarioService.encontrarPorCorreoOUsuario(dto.identificador());

        if (!passwordEncoder.matches(dto.clave(), usuario.getClave())) {
            throw new CredencialesInvalidasException("Credenciales inválidas");
        }

        refreshTokenService.revocarTodos(usuario);

        RefreshTokenResultDTO refreshTokenResultDTO = refreshTokenService.crear(usuario);

        String refreshToken = refreshTokenResultDTO.token();
        String accessToken = jwtService.generateAccessToken(usuario);

        return new AuthTokensDTO(
                accessToken,
                refreshToken
        );
    }

    @Transactional(readOnly = true)
    public AuthPayloadDTO getPayload(String accessToken) {
        Usuario usuario = usuarioService.obtenerPorId(Long.valueOf(jwtService.extractUserId(accessToken)))
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        return new AuthPayloadDTO(usuario.getId(), usuario.getUsuario(), usuario.getPerfil().getNombre());
    }

    @Transactional
    public AuthTokensDTO refresh(RefreshRequestDTO dto) {
        RefreshTokenResultDTO refreshTokenResultDTO = refreshTokenService.rotar(dto.refreshToken());

        String refreshToken = refreshTokenResultDTO.token();
        String accessToken = jwtService.generateAccessToken(refreshTokenResultDTO.entidad().getUsuario());

        return new AuthTokensDTO(
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public AuthTokensDTO refresh(String refreshTokenString) {
        RefreshTokenResultDTO refreshTokenResultDTO = refreshTokenService.rotar(refreshTokenString);

        String refreshToken = refreshTokenResultDTO.token();
        String accessToken = jwtService.generateAccessToken(refreshTokenResultDTO.entidad().getUsuario());

        return new AuthTokensDTO(
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public void logout(String refreshTokenString) {
        refreshTokenService.revocar(refreshTokenString);
    }

    @Transactional
    public void logoutAll(Usuario usuario) {
        refreshTokenService.revocarTodos(usuario);
    }

    @Transactional
    public void logoutAll(Long idUsuario) {
        refreshTokenService.revocarTodos(
                usuarioService.obtenerPorId(idUsuario)
                        .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con esa ID"))
        );
    }
}
