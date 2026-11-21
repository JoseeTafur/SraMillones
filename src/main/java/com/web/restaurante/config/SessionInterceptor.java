package com.web.restaurante.config;

import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.dto.login.OpcionMenuDTO;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequiredArgsConstructor
@Component
public class SessionInterceptor implements HandlerInterceptor {

    private final RateLimitManager rateLimitManager;

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler) throws Exception {

        String path = request.getRequestURI();
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

        if (queryString != null && queryString.contains("error=ratelimit")) {
            return true;
        }

        // 3. Rate Limiting por IP o Sesión
        String claveIdentificadora;
        boolean esAutenticado = false;
        LoginResponseDTO datosSesion = null;

        if (session != null && session.getAttribute("datosSesion") instanceof LoginResponseDTO dto) {
            datosSesion = dto;
            claveIdentificadora = "SESSION_" + session.getId();
            esAutenticado = true;
        } else if (session != null && session.getAttribute("usuarioId") != null) {
            claveIdentificadora = "SESSION_" + session.getId();
            esAutenticado = true;
        } else {
            String ip = request.getRemoteAddr();
            claveIdentificadora = "IP_" + (ip != null ? ip : "UNKNOWN");
        }

        Bucket bucket = rateLimitManager.obtenerBucket(claveIdentificadora, esAutenticado);

        if (!bucket.tryConsume(1)) {
            manejadorBloqueoRateLimit(request, response, session);
            return false;
        }

        // 4. Verificación de Sesión y Permisos para API REST
        boolean esRutaApi = path.startsWith("/api/") || path.contains("/api/");

        if (esRutaApi) {
            if (!esAutenticado) {
                escribirJsonError(response, HttpStatus.UNAUTHORIZED, "Sesión no válida o expirada.");
                return false;
            }

            if (datosSesion != null && !tienePermisoParaRuta(path, datosSesion)) {
                escribirJsonError(response, HttpStatus.FORBIDDEN, "No tienes permisos asignados para acceder a este módulo.");
                return false;
            }

            return true;
        }

        // 5. Verificación para Vistas HTML Clásicas
        if (!esAutenticado) {
            response.sendRedirect("/login");
            return false;
        }

        return true;
    }

    private boolean tienePermisoParaRuta(String apiPath, LoginResponseDTO sesion) {
        String rol = sesion.getRol();
        if ("SUPER_ADMIN".equals(rol) || "ADMIN".equals(rol)) {
            return true;
        }

        // Recolecta todas las rutas de opciones permitidas en la sesión del usuario
        Set<String> rutasPermitidas = new HashSet<>();
        if (sesion.getOpcionesIndependientes() != null) {
            sesion.getOpcionesIndependientes().forEach(op -> rutasPermitidas.add(op.getRuta()));
        }
        if (sesion.getMenuAgrupado() != null) {
            for (List<OpcionMenuDTO> grupo : sesion.getMenuAgrupado().values()) {
                grupo.forEach(op -> rutasPermitidas.add(op.getRuta()));
            }
        }

        // Rutas generales permitidas a cualquier empleado autenticado
        if (apiPath.startsWith("/api/mi-perfil") || apiPath.startsWith("/api/dashboard")) {
            return true;
        }

        // Mapeo estricto entre endpoints API y los checkboxes de la tabla `opcion`
        if (apiPath.startsWith("/api/mesas") || apiPath.startsWith("/api/mesero") || apiPath.startsWith("/api/comandas")) {
            return tieneAlguna(rutasPermitidas, "/admin/mesas", "/mesas");
        }
        if (apiPath.startsWith("/api/reservas")) {
            return tieneAlguna(rutasPermitidas, "/admin/reservas", "/reservas");
        }
        if (apiPath.startsWith("/api/caja")) {
            return tieneAlguna(rutasPermitidas, "/admin/caja", "/admin/caja-general", "/caja");
        }
        if (apiPath.startsWith("/api/admin/cocina")) {
            return tieneAlguna(rutasPermitidas, "/admin/cocina", "/cocina");
        }
        if (apiPath.startsWith("/api/admin/productos-precios")) {
            return tieneAlguna(rutasPermitidas, "/admin/productos-ajuste", "/admin/productos");
        }
        if (apiPath.startsWith("/api/admin/productos")) {
            // Meseros necesitan leer productos para tomar comandas, pero solo con permiso pueden crear/editar/eliminar
            return tieneAlguna(rutasPermitidas, "/admin/productos", "/admin/mesas");
        }
        if (apiPath.startsWith("/api/usuarios")) {
            return tieneAlguna(rutasPermitidas, "/admin/usuarios");
        }
        if (apiPath.startsWith("/api/perfiles")) {
            return tieneAlguna(rutasPermitidas, "/admin/perfiles");
        }
        if (apiPath.startsWith("/api/empleados")) {
            return tieneAlguna(rutasPermitidas, "/admin/empleados");
        }
        if (apiPath.startsWith("/admin/pagos-digitales")) {
            return tieneAlguna(rutasPermitidas, "/admin/pagos-digitales");
        }
        if (apiPath.startsWith("/api/caja") || apiPath.startsWith("/admin/pagos-digitales")) {
            return tieneAlguna(rutasPermitidas, "/admin/caja", "/admin/caja-general", "/caja", "/admin/pagos-digitales");
        }

        return false; // Denegar por defecto cualquier ruta API no mapeada
    }

    private boolean tieneAlguna(Set<String> rutasPermitidas, String... opcionesRequeridas) {
        for (String req : opcionesRequeridas) {
            if (rutasPermitidas.contains(req)) {
                return true;
            }
        }
        return false;
    }

    private void escribirJsonError(HttpServletResponse response, HttpStatus status, String mensaje) throws Exception {
        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\": false, \"message\": \"" + mensaje + "\"}");
    }

    private void manejadorBloqueoRateLimit(HttpServletRequest request, HttpServletResponse response, HttpSession session) throws Exception {
        String acceptHeader = request.getHeader("Accept");
        String requestedWith = request.getHeader("X-Requested-With");

        boolean esPeticionJson = (acceptHeader != null && acceptHeader.contains("application/json")) ||
                "XMLHttpRequest".equals(requestedWith) || request.getServletPath().startsWith("/api/");

        if (esPeticionJson) {
            escribirJsonError(response, HttpStatus.TOO_MANY_REQUESTS, "Demasiadas solicitudes. Por favor espera un momento.");
        } else {
            boolean tieneSesion = session != null && (session.getAttribute("datosSesion") != null || session.getAttribute("usuarioId") != null);
            String rutaDestino = tieneSesion ? "/dashboard?error=ratelimit" : "/login?error=ratelimit";
            response.sendRedirect(rutaDestino);
        }
    }
}