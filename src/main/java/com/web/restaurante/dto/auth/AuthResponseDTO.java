package com.web.restaurante.dto.auth;

import java.time.Instant;

public record AuthResponseDTO(
    String accessToken,
//    String tokenType,
//    Instant accessTokenExpiresAt,
//    String refreshToken,
//    Instant refreshTokenExpiresAt,
    AuthPayloadDTO payload
) {
}
