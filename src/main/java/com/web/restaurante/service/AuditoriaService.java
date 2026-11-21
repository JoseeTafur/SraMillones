package com.web.restaurante.service;

import com.web.restaurante.dto.login.LoginResponseDTO;
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
        Long idUsuario = null;
        String nombreUsuario = "SISTEMA / WEB";
        String rolUsuario = "PUBLICO";

        HttpSession session = obtenerSesionActual();
        if (session != null) {
            Object datosSesion = session.getAttribute("datosSesion");
            Object usuarioLogueado = session.getAttribute("usuarioLogueado");

            if (datosSesion instanceof LoginResponseDTO dto) {
                idUsuario = dto.getUsuarioId();
                if (dto.getNombreUsuario() != null && !dto.getNombreUsuario().isBlank()) {
                    nombreUsuario = dto.getNombreUsuario().trim();
                }
                if (dto.getRol() != null && !dto.getRol().isBlank()) {
                    rolUsuario = dto.getRol().trim();
                }
            } else if (usuarioLogueado instanceof Usuario actor) {
                idUsuario = actor.getId();
                nombreUsuario = resolverNombreUsuario(actor);
                if (actor.getPerfil() != null && actor.getPerfil().getNombre() != null) {
                    rolUsuario = actor.getPerfil().getNombre();
                }
            } else {
                Object idAttr = session.getAttribute("usuarioId");
                Object nomAttr = session.getAttribute("nombreUsuario");
                Object rolAttr = session.getAttribute("rol");

                if (idAttr != null) idUsuario = Long.valueOf(idAttr.toString());
                if (nomAttr != null && !nomAttr.toString().isBlank()) nombreUsuario = nomAttr.toString().trim();
                if (rolAttr != null && !rolAttr.toString().isBlank()) rolUsuario = rolAttr.toString().trim();
            }
        }

        AuditoriaEvento evento = AuditoriaEvento.builder()
                .idUsuario(idUsuario)
                .usuarioNombre(nombreUsuario)
                .rolUsuario(rolUsuario)
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

    private HttpSession obtenerSesionActual() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attr == null) return null;
            return attr.getRequest().getSession(false);
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