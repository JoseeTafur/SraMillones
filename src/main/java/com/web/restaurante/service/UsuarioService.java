package com.web.restaurante.service;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.mapper.UsuarioMapper;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.repository.UsuarioRepository;
import com.web.restaurante.repository.PerfilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PerfilRepository perfilRepository;
    private final AuditoriaService auditoriaService;
    private final UsuarioMapper usuarioMapper;

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return usuarioRepository.findAllByEstadoNot(2);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> encontrarPorUsuario(String usuario) {
        return usuarioRepository.findByUsuarioAndEstadoNot(usuario, 2);
    }

    @Transactional(readOnly = true)
    public Usuario encontrarPorCorreoOUsuario(String identificador) {
        List<Usuario> usuarios = usuarioRepository.findByCorreoIgnoreCase(identificador);

        if (usuarios.isEmpty()) {
            usuarios = usuarioRepository.findByUsuarioIgnoreCase(identificador);
        }

        return usuarios.stream()
                .filter(u -> u.getEstado() == 1)
                .findFirst()
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }

    @Transactional
    public Usuario guardar(Usuario usuario) {
        if (usuario.getPerfil() == null || usuario.getPerfil().getId() == null) {
            throw new IllegalArgumentException("El perfil / rol de acceso es obligatorio para registrar un usuario.");
        }

        if (usuario.getId() != null) {
            Usuario existente = usuarioRepository.findById(usuario.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado para actualizar"));

            String perfilNuevoNombre = perfilRepository.findById(usuario.getPerfil().getId())
                    .map(p -> p.getNombre().toUpperCase()).orElse("");

            String perfilActualNombre = existente.getPerfil() != null
                    ? existente.getPerfil().getNombre().toUpperCase() : "";

            String estadoAntes = "Usuario: " + existente.getUsuario() + " | Correo: " + existente.getCorreo() + " | Perfil: " + (existente.getPerfil() != null ? existente.getPerfil().getNombre() : "Sin perfil");

            if (perfilNuevoNombre.contains("ADMINISTRADOR") && !perfilActualNombre.contains("ADMINISTRADOR")) {
                long totalAdmins = usuarioRepository.countByPerfil_NombreIgnoreCaseAndEstadoNot("Administrador", 2);
                if (totalAdmins >= 3) {
                    throw new IllegalArgumentException("No se pueden registrar más de 3 administradores en el sistema.");
                }
            }

            validarDuplicados(usuario);

            existente.setUsuario(usuario.getUsuario().trim());
            existente.setCorreo(usuario.getCorreo().trim());
            existente.setPerfil(usuario.getPerfil());

            boolean cambioClave = !esClaveVacia(usuario.getClave());
            if (cambioClave) {
                existente.setClave(passwordEncoder.encode(usuario.getClave().trim()));
            }

            Usuario guardado = usuarioRepository.save(existente);
            String perfilFinalNombre = perfilRepository.findById(guardado.getPerfil().getId())
                    .map(p -> p.getNombre()).orElse(perfilNuevoNombre);

            auditoriaService.registrar(
                    "USUARIOS",
                    "EDITAR_USUARIO",
                    "Usuario",
                    guardado.getId(),
                    "Usuario actualizado: '" + guardado.getUsuario() + "'" + (cambioClave ? " (incluyó cambio de contraseña)" : ""),
                    estadoAntes,
                    "Usuario: " + guardado.getUsuario() + " | Correo: " + guardado.getCorreo() + " | Perfil: " + perfilFinalNombre + (cambioClave ? " | Clave: [ACTUALIZADA]" : "")
            );

            return guardado;
        }

        validarDuplicados(usuario);
        validarClave(usuario.getClave());

        String perfilAsignado = perfilRepository.findById(usuario.getPerfil().getId())
                .map(p -> p.getNombre()).orElse("Sin perfil");

        perfilRepository.findById(usuario.getPerfil().getId()).ifPresent(perfil -> {
            if ("Administrador".equalsIgnoreCase(perfil.getNombre())) {
                long totalAdmins = usuarioRepository.countByPerfil_NombreIgnoreCaseAndEstadoNot("Administrador", 2);
                if (totalAdmins >= 3) {
                    throw new IllegalArgumentException("No se pueden registrar más de 3 administradores en el sistema.");
                }
            }
        });

        usuario.setClave(passwordEncoder.encode(usuario.getClave().trim()));
        Usuario guardado = usuarioRepository.save(usuario);

        auditoriaService.registrar(
                "USUARIOS",
                "CREAR_USUARIO",
                "Usuario",
                guardado.getId(),
                "Nuevo usuario creado: '" + guardado.getUsuario() + "' (" + perfilAsignado + ")",
                null,
                "Usuario: " + guardado.getUsuario() + " | Correo: " + guardado.getCorreo() + " | Perfil: " + perfilAsignado
        );

        return guardado;
    }

    @Transactional
    public Usuario alternarEstado(Long id) {
        validarId(id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        int estadoAnterior = usuario.getEstado();
        int estadoNuevo = estadoAnterior == 1 ? 0 : 1;
        usuario.setEstado(estadoNuevo);
        Usuario guardado = usuarioRepository.save(usuario);

        auditoriaService.registrar(
                "USUARIOS",
                "CAMBIAR_ESTADO_USUARIO",
                "Usuario",
                guardado.getId(),
                "Estado de usuario '" + guardado.getUsuario() + "' cambiado a " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoAnterior == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO")
        );

        return guardado;
    }

    @Transactional
    public void eliminar(Long id) {
        validarId(id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String usuarioOriginal = usuario.getUsuario();
        String correoOriginal = usuario.getCorreo();
        String perfilOriginal = usuario.getPerfil() != null ? usuario.getPerfil().getNombre() : "Sin perfil";

        usuario.setUsuario(usuario.getUsuario() + "_DELETED_" + usuario.getId());

        if (usuario.getCorreo() != null && !usuario.getCorreo().isBlank()) {
            usuario.setCorreo(usuario.getCorreo() + "_DELETED_" + usuario.getId());
        }

        usuario.setEstado(2);

        usuarioRepository.save(usuario);

        auditoriaService.registrar(
                "USUARIOS",
                "ELIMINAR_USUARIO",
                "Usuario",
                usuario.getId(),
                "Usuario eliminado/purgado: '" + usuarioOriginal + "'",
                "Usuario: " + usuarioOriginal + " | Correo: " + correoOriginal + " | Perfil: " + perfilOriginal,
                "Estado: ELIMINADO (credenciales liberadas)"
        );

        System.out.println("🧹 [La Jama Security] Cuenta ID #" + id + " purgada y credenciales originales liberadas.");
    }

    @Transactional(readOnly = true)
    public Optional<TokenUsuarioDTO> getTokenUsuarioDTOById(Long id) {
        return usuarioRepository.findById(id).map(usuarioMapper::toTokenDTO);
    }

    @Transactional(readOnly = true)
    public long contar() {
        return usuarioRepository.countByEstadoNot(2);
    }

    public boolean verificarClave(String claveTextoPlano, String claveEncriptada) {
        return passwordEncoder.matches(claveTextoPlano, claveEncriptada);
    }

    private boolean esUsuarioDuplicado(String username, Long id) {
        List<Usuario> coincidencias = usuarioRepository.findByUsuarioIgnoreCase(username);

        return coincidencias.stream()
                .filter(u -> u.getEstado() != 2)
                .anyMatch(u -> !u.getId().equals(id));
    }

    private boolean esCorreoDuplicado(String correo, Long id) {
        List<Usuario> coincidencias = usuarioRepository.findByCorreoIgnoreCase(correo);

        return coincidencias.stream()
                .filter(u -> u.getEstado() != 2)
                .anyMatch(u -> !u.getId().equals(id));
    }

    private void validarDuplicados(Usuario usuario) {
        if (esUsuarioDuplicado(usuario.getUsuario(), usuario.getId())) {
            throw new IllegalArgumentException("Este usuario ya está en uso por otra cuenta activa.");
        }

        if (esCorreoDuplicado(usuario.getCorreo(), usuario.getId())) {
            throw new IllegalArgumentException("El correo ya está en uso por otra cuenta activa.");
        }
    }

    private void validarId(Long id) {
        if (id == null) throw new IllegalArgumentException("ID de usuario es null");
        if (id <= 0) throw new IllegalArgumentException("ID de usuario inválido");
    }

    private boolean esClaveVacia(String clave) {
        return clave == null || clave.trim().isEmpty();
    }

    private void validarClave(String clave) {
        if (clave == null) throw new IllegalArgumentException("La clave es null");
        if (clave.trim().isEmpty()) throw new IllegalArgumentException("La clave está vacía");
    }
}