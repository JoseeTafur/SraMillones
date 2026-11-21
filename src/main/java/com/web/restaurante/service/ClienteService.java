package com.web.restaurante.service;

import com.web.restaurante.dto.cliente.ClienteDTO;
import com.web.restaurante.dto.cliente.ClienteSaveDTO;
import com.web.restaurante.mapper.ClienteMapper;
import com.web.restaurante.model.Cliente;
import com.web.restaurante.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public ClienteDTO obtener(Long id) {
        return clienteMapper.toDTO(clienteRepository.findByIdAndEstadoNot(id, 2)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró cliente")));
    }

    @Transactional(readOnly = true)
    public Page<ClienteDTO> buscar(String selectorEstado, String texto, Pageable pageable) {
        if (pageable.getPageNumber() < 0 || pageable.getPageSize() < 1 || pageable.getPageSize() > 100) {
            throw new IllegalArgumentException("Parámetros de página inválidos");
        }

        if ("todos".equals(selectorEstado) || "all".equals(selectorEstado)) {
            return clienteRepository.buscarPorEstadoNot(2, texto, pageable).map(clienteMapper::toDTO);
        }

        if ("activo".equals(selectorEstado) || "1".equals(selectorEstado)) {
            return clienteRepository.buscarPorEstado(1, texto, pageable).map(clienteMapper::toDTO);
        }

        if ("inactivo".equals(selectorEstado) || "0".equals(selectorEstado)) {
            return clienteRepository.buscarPorEstado(0, texto, pageable).map(clienteMapper::toDTO);
        }

        throw new IllegalArgumentException("Selector de estado inválido");
    }

    @Transactional
    public ClienteDTO crear(ClienteSaveDTO dto) {
        Cliente nuevo = new Cliente();

        nuevo.setNombre(dto.nombre());
        nuevo.setApellido(dto.apellido());

        if (clienteRepository.findByDniAndEstado(dto.dni(), 1).isPresent())
            throw new IllegalArgumentException("Ya existe un cliente con ese DNI");
        nuevo.setDni(dto.dni());

        if (clienteRepository.findByTelefonoAndEstado(dto.telefono(), 1).isPresent())
            throw new IllegalArgumentException("Ya existe un cliente con ese teléfono");
        nuevo.setTelefono(dto.telefono());

        if (clienteRepository.findByCorreoAndEstado(dto.correo(), 1).isPresent())
            throw new IllegalArgumentException("Ya existe un cliente con ese correo");
        nuevo.setCorreo(dto.correo());

        Cliente guardado = clienteRepository.save(nuevo);

        auditoriaService.registrar(
                "CLIENTES",
                "CREAR_CLIENTE",
                "Cliente",
                guardado.getId(),
                "Nuevo cliente registrado: " + guardado.getNombre() + " " + guardado.getApellido() + " (DNI: " + guardado.getDni() + ")",
                null,
                "Cliente: " + guardado.getNombre() + " " + guardado.getApellido() +
                        " | DNI: " + guardado.getDni() +
                        " | Tel: " + guardado.getTelefono() +
                        " | Correo: " + guardado.getCorreo()
        );

        return clienteMapper.toDTO(guardado);
    }

    @Transactional
    public ClienteDTO actualizar(ClienteSaveDTO dto, Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstado(id, 1);

        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");

        Cliente existente = opt.get();

        String estadoAntes = "Cliente: " + existente.getNombre() + " " + existente.getApellido() +
                " | DNI: " + existente.getDni() +
                " | Tel: " + existente.getTelefono() +
                " | Correo: " + existente.getCorreo() +
                " | Dir: " + existente.getDireccion();

        existente.setNombre(dto.nombre());
        existente.setApellido(dto.apellido());
        existente.setDni(dto.dni());
        existente.setTelefono(dto.telefono());
        existente.setCorreo(dto.correo());
        existente.setDireccion(dto.direccion());

        Cliente guardado = clienteRepository.save(existente);

        auditoriaService.registrar(
                "CLIENTES",
                "EDITAR_CLIENTE",
                "Cliente",
                guardado.getId(),
                "Datos de cliente actualizados: " + guardado.getNombre() + " " + guardado.getApellido(),
                estadoAntes,
                "Cliente: " + guardado.getNombre() + " " + guardado.getApellido() +
                        " | DNI: " + guardado.getDni() +
                        " | Tel: " + guardado.getTelefono() +
                        " | Correo: " + guardado.getCorreo() +
                        " | Dir: " + guardado.getDireccion()
        );

        return clienteMapper.toDTO(guardado);
    }

    @Transactional
    public ClienteDTO alternarEstado(Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstadoNot(id, 2);
        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");
        Cliente existente = opt.get();

        int estadoAnterior = existente.getEstado() != null ? existente.getEstado() : 1;
        int estadoNuevo = estadoAnterior == 1 ? 0 : 1;
        existente.setEstado(estadoNuevo);

        Cliente guardado = clienteRepository.save(existente);

        auditoriaService.registrar(
                "CLIENTES",
                "CAMBIAR_ESTADO_CLIENTE",
                "Cliente",
                guardado.getId(),
                "Estado de cliente '" + guardado.getNombre() + " " + guardado.getApellido() + "' cambiado a " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoAnterior == 1 ? "ACTIVO" : "INACTIVO"),
                "Estado: " + (estadoNuevo == 1 ? "ACTIVO" : "INACTIVO")
        );

        return clienteMapper.toDTO(guardado);
    }

    @Transactional
    public void eliminar(Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstadoNot(id, 2);
        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");
        Cliente existente = opt.get();

        String nombreCompleto = existente.getNombre() + " " + existente.getApellido();
        String dni = existente.getDni();

        existente.setEstado(2);
        clienteRepository.save(existente);

        auditoriaService.registrar(
                "CLIENTES",
                "ELIMINAR_CLIENTE",
                "Cliente",
                existente.getId(),
                "Cliente eliminado: " + nombreCompleto + " (DNI: " + dni + ")",
                "Cliente: " + nombreCompleto + " | DNI: " + dni,
                "Estado: ELIMINADO"
        );
    }
}