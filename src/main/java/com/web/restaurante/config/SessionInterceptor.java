package com.web.restaurante.config;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@RequiredArgsConstructor
@Component
public class SessionInterceptor implements HandlerInterceptor {

    private final RateLimitManager rateLimitManager;

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler) throws Exception {

        String path = request.getServletPath();
        String queryString = request.getQueryString();

        // 1. Bypass para peticiones preflight de CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 2. Bypass para endpoints públicos de autenticación o assets
        if (path.startsWith("/api/auth/") || path.startsWith("/css/") || path.startsWith("/js/")) {
            return true;
        }

        HttpSession session = request.getSession(false);

        // 3. Excepción RateLimit
        if (queryString != null && queryString.contains("error=ratelimit")) {
            return true;
        }

        // 4. Rate Limiting por IP o Sesión
        String claveIdentificadora;
        boolean esAutenticado = false;

        // 🟢 Corregido: se verifica "datosSesion" o "usuarioId" que establece AuthController
        if (session != null && (session.getAttribute("datosSesion") != null || session.getAttribute("usuarioId") != null)) {
            claveIdentificadora = "SESSION_" + session.getId();
            esAutenticado = true;
        } else {
            String ip = request.getHeader("X-Forwarded-For");
            claveIdentificadora = "IP_" + (ip == null || ip.isEmpty() ? request.getRemoteAddr() : ip.split(",")[0].trim());
        }

        Bucket bucket = rateLimitManager.obtenerBucket(claveIdentificadora, esAutenticado);

        if (!bucket.tryConsume(1)) {
            manejadorBloqueoRateLimit(request, response, session);
            return false;
        }

        // 5. Verificación de Sesión para Peticiones API REST (Acepta /api/ y /usuarios/api/)
        boolean esRutaApi = path.startsWith("/api/") || path.contains("/api/");

        if (esRutaApi) {
            if (!esAutenticado) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value()); // HTTP 401
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\": false, \"message\": \"Sesión no válida o expirada.\"}");
                return false;
            }
            return true; // 🟢 Permite continuar a cualquier endpoint API estando autenticado
        }

        // 6. Verificación para Vistas HTML Clásicas
        if (!esAutenticado) {
            response.sendRedirect("/login");
            return false;
        }

        return true;
    }

    private void manejadorBloqueoRateLimit(HttpServletRequest request, HttpServletResponse response, HttpSession session) throws Exception {
        String acceptHeader = request.getHeader("Accept");
        String requestedWith = request.getHeader("X-Requested-With");

        boolean esPeticionJson = (acceptHeader != null && acceptHeader.contains("application/json")) ||
                "XMLHttpRequest".equals(requestedWith) || request.getServletPath().startsWith("/api/");

        if (esPeticionJson) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // HTTP 429
            response.setContentType("application/json;charset=UTF-8");

            String jsonError = "{\"success\": false, \"message\": \"Demasiadas solicitudes. Por favor espera un momento.\"}";
            response.getWriter().write(jsonError);
        } else {
            boolean tieneSesion = session != null && (session.getAttribute("datosSesion") != null || session.getAttribute("usuarioId") != null);
            String rutaDestino = tieneSesion ? "/dashboard?error=ratelimit" : "/login?error=ratelimit";
            response.sendRedirect(rutaDestino);
        }
    }
}