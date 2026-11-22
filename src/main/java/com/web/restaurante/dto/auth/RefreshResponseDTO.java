package com.web.restaurante.dto.auth;

import java.time.Instant;

public record RefreshResponseDTO(
        String accessToken
//        Instant accessTokenExpiresAt,
//        String refreshToken,
//        Instant refreshTokenExpiresAt
) {
}
