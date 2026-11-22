package com.web.restaurante.service;

import com.web.restaurante.dto.auth.RefreshTokenResultDTO;
import com.web.restaurante.exception.RecursoNoEncontradoException;
import com.web.restaurante.exception.SolicitudIncorrectaException;
import com.web.restaurante.exception.TokenInvalidoException;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.model.auth.RefreshToken;
import com.web.restaurante.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private String hashToken(String refreshTokenString) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(refreshTokenString.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalArgumentException(e);
        }
    }

    @Transactional
    public RefreshTokenResultDTO crear(Usuario usuario) {
        byte[] bytes = new byte[64];
        SECURE_RANDOM.nextBytes(bytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hashToken(token))
                .usuario(usuario)
                .expiracion(Instant.now().plusSeconds(refreshExpiration))
                .revocado(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return new RefreshTokenResultDTO(token, refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken validar(String refreshTokenString) {
        String hash = hashToken(refreshTokenString);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new TokenInvalidoException("Refresh Token inválido"));

        if (refreshToken.isRevocado()) throw new SolicitudIncorrectaException("Refresh Token revocado");

        if (!refreshToken.getExpiracion().isAfter(Instant.now())) throw new SolicitudIncorrectaException("Refresh Token expirado");

        return refreshToken;
    }

    @Transactional
    public void revocar(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(refreshTokenString)
                        .orElseThrow(() -> new RecursoNoEncontradoException("Token no encontrado en la base de datos"));

        refreshToken.setRevocado(true);

        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshTokenResultDTO rotar(String refreshTokenString) {
        RefreshToken actual = validar(refreshTokenString);
        actual.setRevocado(true);
        refreshTokenRepository.save(actual);

        return crear(actual.getUsuario());
    }

    @Transactional
    public void revocarTodos(Usuario usuario) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUsuario_Id(usuario.getId());
        tokens.forEach(t -> t.setRevocado(true));
        refreshTokenRepository.saveAll(tokens);
    }

    @Transactional(readOnly = true)
    public Instant obtenerExpiracion(String refreshTokenString) {
        return validar(refreshTokenString).getExpiracion();
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuario(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(refreshTokenString))
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el token en BD"));

        return refreshToken.getUsuario();
    }
}
