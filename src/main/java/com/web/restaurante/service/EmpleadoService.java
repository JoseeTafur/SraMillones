package com.web.restaurante.service;

import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.exception.RecursoNoEncontradoException;
import com.web.restaurante.model.Cargo;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.repository.CargoRepository;
import com.web.restaurante.repository.EmpleadoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final CargoRepository cargoRepository;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<Empleado> listar() {
        return empleadoRepository.listarNoEliminados();
    }

    @Transactional(readOnly = true)
    public List<Empleado> listarRepartidoresActivos() {
        return empleadoRepository.findByCargo_IdAndEstado(3L, 1);
    }

    @Transactional(readOnly = true)
    public Optional<Empleado> obtenerPorUsuario(Usuario usuario) {
        return empleadoRepository.findByUsuario(usuario);
    }

    @Transactional(readOnly = true)
    public Optional<Empleado> obtenerPorId(Long id) {
        return empleadoRepository.findById(id);
    }

    @Transactional
    public Empleado guardar(Empleado empleado) {
        if (empleado.getCargo() != null && empleado.getCargo().getId() != null) {
            long totalConEsteCargo = empleadoRepository.listarNoEliminados().stream()
                    .filter(e -> e.getCargo() != null && e.getCargo().getId().equals(empleado.getCargo().getId()))
                    .count();

            if (empleado.getId() == null) {
                if (totalConEsteCargo >= 5) {
                    throw new IllegalArgumentException("Cupo completo: El cargo seleccionado ya cuenta con el límite de 5 colaboradores.");
                }
            } else {
                Empleado existente = empleadoRepository.findById(empleado.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));

                boolean cambioDeCargo = existente.getCargo() == null || !existente.getCargo().getId().equals(empleado.getCargo().getId());
                if (cambioDeCargo && totalConEsteCargo >= 5) {
                    throw new IllegalArgumentException("Cupo completo: No se puede migrar. El cargo destino ya cuenta con 5 empleados.");
                }
            }
        }

        if (empleado.getId() != null) {
            Empleado existente = empleadoRepository.findById(empleado.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado para actualizar"));

            validarDuplicados(empleado);

            if (empleado.getUsuario() != null && empleado.getUsuario().getId() != null) {
                Optional<Empleado> empConUsuario = empleadoRepository.findByUsuario(empleado.getUsuario());
                if (empConUsuario.isPresent() && !empConUsuario.get().getId().equals(empleado.getId())) {
                    throw new IllegalArgumentException("La cuenta de usuario seleccionada ya está en uso por otro empleado.");
                }
            }

            String cargoAntes = existente.getCargo() != null ? existente.getCargo().getNombre() : "Sin cargo";
            String usuarioAntes = existente.getUsuario() != null ? existente.getUsuario().getUsuario() : "Sin usuario";
            String estadoAntes = "Empleado: " + existente.getNombre() + " " + existente.getApellido() +
                    " | DNI: " + existente.getDni() +
                    " | Cargo: " + cargoAntes +
                    " | Turno: " + existente.getTurno() +
                    " | Usuario: " + usuarioAntes;

            existente.setNombre(empleado.getNombre().trim());
            existente.setApellido(empleado.getApellido().trim());
            existente.setDni(empleado.getDni());
            existente.setTelefono(empleado.getTelefono());
            existente.setTurno(empleado.getTurno());
            existente.setFechaIngreso(empleado.getFechaIngreso());
            existente.setCargo(empleado.getCargo());
            existente.setUsuario(empleado.getUsuario());

            Empleado guardado = empleadoRepository.save(existente);

            String cargoDespues = (guardado.getCargo() != null && guardado.getCargo().getId() != null)
                    ? cargoRepository.findById(guardado.getCargo().getId()).map(Cargo::getNombre).orElse(cargoAntes)
                    : "Sin cargo";
            String usuarioDespues = (guardado.getUsuario() != null && guardado.getUsuario().getUsuario() != null)
                    ? guardado.getUsuario().getUsuario()
                    : (guardado.getUsuario() != null && guardado.getUsuario().getId() != null ? "ID #" + guardado.getUsuario().getId() : "Sin usuario");

            auditoriaService.registrar(
                    "EMPLEADOS",
                    "EDITAR_EMPLEADO",
                    "Empleado",
                    guardado.getId(),
                    "Datos de empleado actualizados: " + guardado.getNombre() + " " + guardado.getApellido(),
                    estadoAntes,
                    "Empleado: " + guardado.getNombre() + " " + guardado.getApellido() +
                            " | DNI: " + guardado.getDni() +
                            " | Cargo: " + cargoDespues +
                            " | Turno: " + guardado.getTurno() +
                            " | Usuario: " + usuarioDespues
            );

            return guardado;
        }

        validarDuplicados(empleado);

        if (empleado.getUsuario() != null && empleado.getUsuario().getId() != null) {
            if (empleadoRepository.findByUsuario(empleado.getUsuario()).isPresent()) {
                throw new IllegalArgumentException("La cuenta de usuario seleccionada ya está en uso por otro empleado.");
            }
        }

        empleado.setEstado(1);
        Empleado guardado = empleadoRepository.save(empleado);

        String cargoAsignado = (guardado.getCargo() != null && guardado.getCargo().getId() != null)
                ? cargoRepository.findById(guardado.getCargo().getId()).map(Cargo::getNombre).orElse("Cargo #" + guardado.getCargo().getId())
                : "Sin cargo";

        auditoriaService.registrar(
                "EMPLEADOS",
                "CREAR_EMPLEADO",
                "Empleado",
                guardado.getId(),
                "Nuevo empleado registrado: " + guardado.getNombre() + " " + guardado.getApellido() + " (" + cargoAsignado + ")",
                null,
                "Empleado: " + guardado.getNombre() + " " + guardado.getApellido() +
                        " | DNI: " + guardado.getDni() +
                        " | Cargo: " + cargoAsignado +
                        " | Turno: " + guardado.getTurno()
        );

        return guardado;
    }

    @Transactional
    public Empleado alternarEstado(Long id) {
        validarId(id);
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        int estadoAnterior = empleado.getEstado() != null ? empleado.getEstado() : 1;
        int nuevoEstado = estadoAnterior == 1 ? 0 : 1;
        empleadoRepository.actualizarEstado(id, nuevoEstado);
        empleado.setEstado(nuevoEstado);

        auditoriaService.registrar(
                "EMPLEADOS",
                "CAMBIAR_ESTADO_EMPLEADO",
                "Empleado",
                empleado.getId(),
                "Estado de empleado '" + empleado.getNombre() + " " + empleado.getApellido() + "' cambiado a " + (nuevoEstado == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoAnterior == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (nuevoEstado == 1 ? "ACTIVO" : "INACTIVO")
        );

        return empleado;
    }

    @Transactional
    public void eliminar(Long id) {
        validarId(id);
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));

        String nombreCompleto = empleado.getNombre() + " " + empleado.getApellido();
        String dni = empleado.getDni();
        String cargo = empleado.getCargo() != null ? empleado.getCargo().getNombre() : "Sin cargo";

        empleadoRepository.actualizarEstado(id, 2);

        auditoriaService.registrar(
                "EMPLEADOS",
                "ELIMINAR_EMPLEADO",
                "Empleado",
                empleado.getId(),
                "Empleado dado de baja: " + nombreCompleto + " (DNI: " + dni + ")",
                "Empleado: " + nombreCompleto + " | DNI: " + dni + " | Cargo: " + cargo,
                "Estado: BAJA / ELIMINADO"
        );
    }

    @Transactional(readOnly = true)
    public List<Empleado> buscarPorTermino(String termino) {
        if (termino == null || termino.isBlank())
            return listar();
        return empleadoRepository.buscarPorTermino(termino.trim());
    }

    @Transactional(readOnly = true)
    public List<Empleado> buscarPorTurno(String turno) {
        if (turno == null || turno.isBlank())
            return listar();
        return empleadoRepository.buscarPorTurno(turno.trim().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Cargo> listarCargos() {
        return cargoRepository.listarActivos();
    }

    private void validarId(Long id) {
        if (id == null || id <= 0)
            throw new IllegalArgumentException("ID de empleado inválido");
    }

    private void validarDuplicados(Empleado empleado) {
        if (empleado.getDni() != null && !empleado.getDni().isBlank()) {
            boolean existe = empleadoRepository.buscarPorDni(empleado.getDni())
                    .filter(e -> !e.getId().equals(empleado.getId()))
                    .isPresent();
            if (existe) {
                throw new IllegalArgumentException("El DNI ya está registrado por otro empleado.");
            }
        }
    }

    // V2
    public String obtenerTurnoPorIdUsuario(Long id) {
        return empleadoRepository.obtenerTurnoPorIdUsuario(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el turno del usuario"));
    }
}