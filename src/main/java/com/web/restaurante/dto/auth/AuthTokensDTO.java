package com.web.restaurante.dto.auth;

public record AuthTokensDTO(
        String accessToken,
        String refreshToken
) {
}
