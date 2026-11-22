package com.web.restaurante.security;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.exception.SolicitudIncorrectaException;
import com.web.restaurante.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.time.Instant;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Getter
    @Value("${jwt.expiration}")
    private Long expiration;

    private SecretKey getSigninKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Usuario usuario) {
        if (usuario.getPerfil() == null) throw new SolicitudIncorrectaException("El usuario no tiene perfil asignado");

        Instant now = Instant.now();

        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("usuario", usuario.getUsuario())
                .claim("perfil", usuario.getPerfil().getNombre())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expiration)))
                .signWith(getSigninKey(), Jwts.SIG.HS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(getSigninKey()).build()
                    .parseSignedClaims(token).getPayload();
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }
}
