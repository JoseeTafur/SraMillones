package com.web.restaurante;

import com.web.restaurante.dto.login.LoginResponseDTO;
import com.web.restaurante.dto.login.OpcionMenuDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAuditTest {

    @Autowired
    private MockMvc mockMvc;

    private MockHttpSession crearSesionMesero() {
        LoginResponseDTO dtoMesero = LoginResponseDTO.builder()
                .success(true)
                .usuarioId(5L)
                .nombreUsuario("mesero_test")
                .rol("MESERO")
                .menuAgrupado(Map.of(
                        "Salón", List.of(new OpcionMenuDTO(2L, "Mesas y Salón", "/admin/mesas", "table"))
                ))
                .opcionesIndependientes(List.of())
                .build();

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("usuarioId", 5L);
        session.setAttribute("datosSesion", dtoMesero);
        return session;
    }

    private MockHttpSession crearSesionAdmin() {
        LoginResponseDTO dtoAdmin = LoginResponseDTO.builder()
                .success(true)
                .usuarioId(1L)
                .nombreUsuario("admin_test")
                .rol("ADMIN")
                .menuAgrupado(Map.of())
                .opcionesIndependientes(List.of())
                .build();

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("usuarioId", 1L);
        session.setAttribute("datosSesion", dtoAdmin);
        return session;
    }

    @Test
    @DisplayName("1. Petición anónima sin sesión debe devolver 401 Unauthorized")
    void accesoSinSesionDebeDar401() throws Exception {
        mockMvc.perform(get("/api/admin/productos-precios/listar"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/mesas"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. Mesero con permiso solo en /admin/mesas debe recibir 403 en Precios y Productos")
    void meseroNoDebeEscalarPrivilegios() throws Exception {
        MockHttpSession sesionMesero = crearSesionMesero();

        // Puede entrar a mesas (tiene el checkbox activo)
        mockMvc.perform(get("/api/mesas").session(sesionMesero))
                .andExpect(status().isOk());

        // Bloqueado (403 Forbidden) al intentar ver o cambiar precios
        mockMvc.perform(get("/api/admin/productos-precios/listar").session(sesionMesero))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/productos-precios/actualizar-precios")
                        .session(sesionMesero)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"idProducto\": 1, \"nuevoPrecio\": 0.10}]"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Entradas con payload clásico de SQL Injection no deben romper ni vulnerar el sistema")
    void pruebaResistenciaSqlInjection() throws Exception {
        MockHttpSession sesionAdmin = crearSesionAdmin();

        // Intento en login (debe fallar limpiamente sin 500 ni bypass)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\": \"admin' OR '1'='1\", \"clave\": \"' OR '1'='1\"}"))
                .andExpect(status().isBadRequest());

        // Intento en parámetros de búsqueda administrativa
        mockMvc.perform(get("/api/admin/productos")
                        .session(sesionAdmin)
                        .param("filtro", "'; DROP TABLE producto; --"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("4. Voucher público debe rechazar archivos que no sean imágenes válidas")
    void voucherDebeRechazarArchivosNoImagen() throws Exception {
        MockMultipartFile scriptFalso = new MockMultipartFile(
                "file",
                "payload.php",
                "application/x-php",
                "<?php echo 'test'; ?>".getBytes()
        );

        mockMvc.perform(multipart("/api/public/carta/validar-voucher")
                        .file(scriptFalso)
                        .param("total", "45.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valido").value(false));
    }
}