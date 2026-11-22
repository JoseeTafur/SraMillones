package com.web.restaurante.dto.auth;

import com.web.restaurante.model.auth.RefreshToken;

public record RefreshTokenResultDTO(
        String token,
        RefreshToken entidad
) {
}
