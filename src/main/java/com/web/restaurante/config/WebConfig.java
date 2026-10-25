package com.web.restaurante.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;

@RequiredArgsConstructor
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;

    @Value("${app.imagenes.path:file:/C:/restaurante/imagenes/}")
    private String imagenesPath;
    private final SessionInterceptor sessionInterceptor;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/css/**").addResourceLocations("classpath:/static/css/").setCachePeriod(0);
        registry.addResourceHandler("/js/**").addResourceLocations("classpath:/static/js/").setCachePeriod(0);
        registry.addResourceHandler("/imagenes/**").addResourceLocations(imagenesPath);
        registry.addResourceHandler("/favicon.png").addResourceLocations("classpath:/static/").setCachePeriod(0);
        registry.addResourceHandler("/img/**").addResourceLocations("classpath:/static/img/").setCachePeriod(0);

        registry.addResourceHandler("/video/**")
                .addResourceLocations("classpath:/static/video/")
                .setCachePeriod(0);
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(sessionInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/api/auth/**",
                        "/api/admin/productos/**",
                        "/api/admin/cocina/**",
                        "/api/mesero/**",
                        "/api/admin/productos-precios/**",
                        "/api/mesas/**",
                        "/api/comandas/**",
                        "/api/caja/**",
                        "/api/mi-perfil/**",
                        "/api/empleados/**",
                        "/api/reservas/**",
                        "/perfiles/**",
                        "/api/usuarios/**",
                        "/api/perfiles/**",
                        "/carta/**",
                        "/admin/pagos-digitales/api/guardar",
                        "/admin/pagos-digitales/api/actualizar-imagen/**",
                        "/css/**",
                        "/js/**",
                        "/img/**",
                        "/imagenes/**",
                        "/error",
                        "/favicon.png",
                        "/video/**",
                        "/static/**",
                        "/resources/**",
                        "/webjars/**"
                );
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "PATCH", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}