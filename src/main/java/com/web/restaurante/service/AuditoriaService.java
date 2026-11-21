package com.web.restaurante.service;

import com.web.restaurante.model.AuditoriaEvento;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.repository.AuditoriaRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    @Transactional
    public void registrar(
            String modulo,
            String accion,
            String entidad,
            Long idEntidad,
            String descripcion,
            String datosAntes,
            String datosDespues
    ) {
        Usuario actor = obtenerUsuarioActual();

        AuditoriaEvento evento = AuditoriaEvento.builder()
                .idUsuario(actor != null ? actor.getId() : null)
                .usuarioNombre(actor != null ? resolverNombreUsuario(actor) : "SISTEMA / WEB")
                .rolUsuario(actor != null && actor.getPerfil() != null ? actor.getPerfil().getNombre() : "PUBLICO")
                .modulo(modulo)
                .accion(accion)
                .entidad(entidad)
                .idEntidad(idEntidad)
                .descripcion(descripcion)
                .datosAntes(datosAntes)
                .datosDespues(datosDespues)
                .build();

        auditoriaRepository.save(evento);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaEvento> listarRecientes() {
        return auditoriaRepository.findTop200ByOrderByFechaHoraDesc();
    }

    private Usuario obtenerUsuarioActual() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attr == null) return null;
            HttpSession session = attr.getRequest().getSession(false);
            if (session == null) return null;
            return (Usuario) session.getAttribute("usuarioLogueado");
        } catch (Exception e) {
            return null;
        }
    }

    private String resolverNombreUsuario(Usuario u) {
        String[] metodosCandidatos = {"getNombres", "getNombre", "getNombreCompleto", "getUsuario", "getUsername", "getCorreo", "getEmail"};
        for (String nombreMetodo : metodosCandidatos) {
            try {
                Method m = u.getClass().getMethod(nombreMetodo);
                Object val = m.invoke(u);
                if (val != null && !val.toString().isBlank()) {
                    return val.toString().trim();
                }
            } catch (Exception ignored) {
            }
        }
        return "Usuario #" + u.getId();
    }
}