package com.web.restaurante.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;

public class CookieUtil {

    private static final String COOKIE_NAME = "refreshToken";

    @Value("${app.security.cookie.secure}")
    private static boolean secure;

    public static ResponseCookie crear(String token, long maxAge) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .path("/api/auth")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
    }

    public static ResponseCookie eliminar() {
        return crear("", 0);
    }
}
