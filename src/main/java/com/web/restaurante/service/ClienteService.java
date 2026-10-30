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

        return clienteMapper.toDTO(clienteRepository.save(nuevo));
    }

    @Transactional
    public ClienteDTO actualizar(ClienteSaveDTO dto, Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstado(id, 1);

        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");

        Cliente existente = opt.get();

        existente.setNombre(dto.nombre());
        existente.setApellido(dto.apellido());
        existente.setDni(dto.dni());
        existente.setTelefono(dto.telefono());
        existente.setCorreo(dto.correo());

        return clienteMapper.toDTO(clienteRepository.save(existente));
    }

    @Transactional
    public ClienteDTO alternarEstado(Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstadoNot(id, 2);
        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");
        Cliente existente = opt.get();

        existente.setEstado(existente.getEstado() == 1 ? 0 : 1);

        return clienteMapper.toDTO(clienteRepository.save(existente));
    }

    @Transactional
    public void eliminar(Long id) {
        Optional<Cliente> opt = clienteRepository.findByIdAndEstadoNot(id, 2);
        if (opt.isEmpty()) throw new IllegalArgumentException("No existe un cliente con esa ID");
        Cliente existente = opt.get();

        existente.setEstado(2);
        clienteRepository.save(existente);
    }
}
