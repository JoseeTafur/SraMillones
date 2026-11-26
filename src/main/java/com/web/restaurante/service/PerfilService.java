package com.web.restaurante.service;

import com.web.restaurante.dto.perfil.PerfilDTO;
import com.web.restaurante.dto.sidebar.OpcionDTO;
import com.web.restaurante.mapper.OpcionMapper;
import com.web.restaurante.mapper.PerfilMapper;
import com.web.restaurante.model.Opcion;
import com.web.restaurante.model.Perfil;
import com.web.restaurante.repository.OpcionRepository;
import com.web.restaurante.repository.PerfilRepository;
import com.web.restaurante.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class PerfilService {

    private final PerfilRepository perfilRepository;
    private final OpcionRepository opcionRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final PerfilMapper perfilMapper;
    private final OpcionMapper opcionMapper;

    @Transactional(readOnly = true)
    public List<Perfil> listar() {
        return perfilRepository.findAllByEstadoNot(2);
    }

    @Transactional(readOnly = true)
    public List<PerfilDTO> listar2() {
        return perfilRepository.findAllByEstadoNot(2)
                .stream().map(perfilMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Perfil> obtenerPorId(Long id) {
        return perfilRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Perfil> encontrarPorNombre(String nombre) {
        return perfilRepository.findByNombreIgnoreCase(nombre);
    }

    @Transactional
    public Perfil guardar(Perfil perfil) {
        if (perfil.getId() != null) {
            Perfil existente = perfilRepository.findById(perfil.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado para actualizar"));

            validarDuplicados(perfil);

            String opcionesAntes = existente.getOpciones() != null && !existente.getOpciones().isEmpty()
                    ? existente.getOpciones().stream().map(Opcion::getNombre).sorted().collect(Collectors.joining(", "))
                    : "Ninguna";
            String estadoAntes = "Perfil: " + existente.getNombre() + " | Desc: " + existente.getDescripcion() + " | Permisos (" + (existente.getOpciones() != null ? existente.getOpciones().size() : 0) + "): " + opcionesAntes;

            existente.setNombre(perfil.getNombre().trim());
            existente.setDescripcion(perfil.getDescripcion().trim());

            existente.getOpciones().clear();

            if (perfil.getOpciones() != null) {
                for (Opcion opForm : perfil.getOpciones()) {
                    if (opForm.getId() != null) {
                        opcionRepository.findById(opForm.getId()).ifPresent(opcionBD -> {
                            existente.getOpciones().add(opcionBD);
                        });
                    }
                }
            }

            Perfil guardado = perfilRepository.save(existente);

            String opcionesDespues = guardado.getOpciones() != null && !guardado.getOpciones().isEmpty()
                    ? guardado.getOpciones().stream().map(Opcion::getNombre).sorted().collect(Collectors.joining(", "))
                    : "Ninguna";

            auditoriaService.registrar(
                    "PERFILES",
                    "EDITAR_PERFIL",
                    "Perfil",
                    guardado.getId(),
                    "Perfil actualizado: '" + guardado.getNombre() + "' (" + (guardado.getOpciones() != null ? guardado.getOpciones().size() : 0) + " permisos)",
                    estadoAntes,
                    "Perfil: " + guardado.getNombre() + " | Desc: " + guardado.getDescripcion() + " | Permisos (" + (guardado.getOpciones() != null ? guardado.getOpciones().size() : 0) + "): " + opcionesDespues
            );

            return guardado;
        }

        validarDuplicados(perfil);

        java.util.List<Opcion> opcionesFormulario = perfil.getOpciones() != null ?
                new java.util.ArrayList<>(perfil.getOpciones()) : new java.util.ArrayList<>();

        if (perfil.getOpciones() != null) {
            perfil.getOpciones().clear();
        } else {
            perfil.setOpciones(new java.util.HashSet<>());
        }

        for (Opcion opForm : opcionesFormulario) {
            if (opForm.getId() != null) {
                opcionRepository.findById(opForm.getId()).ifPresent(opcionBD -> {
                    perfil.getOpciones().add(opcionBD);
                });
            }
        }

        Perfil guardado = perfilRepository.save(perfil);

        String opcionesAsignadas = guardado.getOpciones() != null && !guardado.getOpciones().isEmpty()
                ? guardado.getOpciones().stream().map(Opcion::getNombre).sorted().collect(Collectors.joining(", "))
                : "Ninguna";

        auditoriaService.registrar(
                "PERFILES",
                "CREAR_PERFIL",
                "Perfil",
                guardado.getId(),
                "Nuevo perfil creado: '" + guardado.getNombre() + "' (" + (guardado.getOpciones() != null ? guardado.getOpciones().size() : 0) + " permisos)",
                null,
                "Perfil: " + guardado.getNombre() + " | Desc: " + guardado.getDescripcion() + " | Permisos: " + opcionesAsignadas
        );

        return guardado;
    }

    @Transactional
    public Perfil alternarEstado(Long id) {
        validarId(id);

        Perfil perfil = perfilRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado"));

        int estadoAnterior = perfil.getEstado() != null ? perfil.getEstado() : 1;
        int estadoNuevo = estadoAnterior == 1 ? 0 : 1;
        perfil.setEstado(estadoNuevo);
        Perfil guardado = perfilRepository.save(perfil);

        auditoriaService.registrar(
                "PERFILES",
                "CAMBIAR_ESTADO_PERFIL",
                "Perfil",
                guardado.getId(),
                "Estado de perfil '" + guardado.getNombre() + "' cambiado a " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoAnterior == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO")
        );

        return guardado;
    }

    @Transactional
    public void eliminar(Long id) {
        validarId(id);

        long usuariosAsociados = usuarioRepository.countByPerfil_Id(id);
        if (usuariosAsociados > 0) {
            throw new IllegalArgumentException("No se puede eliminar el perfil, esta relacionado con uno o más usuarios");
        }

        Perfil perfil = perfilRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado"));

        String nombrePerfil = perfil.getNombre();
        String descripcionPerfil = perfil.getDescripcion();

        perfil.setEstado(2);
        perfilRepository.save(perfil);

        auditoriaService.registrar(
                "PERFILES",
                "ELIMINAR_PERFIL",
                "Perfil",
                perfil.getId(),
                "Perfil eliminado: '" + nombrePerfil + "'",
                "Perfil: " + nombrePerfil + " | Desc: " + descripcionPerfil,
                "Estado: ELIMINADO"
        );
    }

    @Transactional(readOnly = true)
    public List<Opcion> listarOpciones() {
        return opcionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<OpcionDTO> listarOpciones2() {
        return opcionRepository.findAll()
                .stream().map(opcionMapper::toDTO).toList();
    }

    private boolean esNombreDuplicado(String nombre, Long id) {
        return perfilRepository.findByNombreIgnoreCase(nombre)
                .filter(p -> p.getEstado() != 2)
                .filter(p -> !p.getId().equals(id))
                .isPresent();
    }

    private void validarDuplicados(Perfil perfil) {
        if (esNombreDuplicado(perfil.getNombre(), perfil.getId())) {
            throw new IllegalArgumentException("Este nombre de perfil ya está en uso.");
        }
    }

    private void validarId(Long id) {
        if (id == null) throw new IllegalArgumentException("ID de perfil es null");
        if (id <= 0) throw new IllegalArgumentException("ID de perfil inválido");
    }
}