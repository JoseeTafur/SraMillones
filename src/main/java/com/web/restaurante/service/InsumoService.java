package com.web.restaurante.service;

import com.web.restaurante.dto.InsumoDTO;
import com.web.restaurante.dto.InsumoProductoDTO;
import com.web.restaurante.dto.MovimientoInsumoDTO;
import com.web.restaurante.mapper.InsumoMapper;
import com.web.restaurante.model.Insumo;
import com.web.restaurante.model.InsumoProducto;
import com.web.restaurante.model.Producto;
import com.web.restaurante.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsumoService {

    private final InsumoRepository insumoRepository;
    private final InsumoProductoRepository insumoProductoRepository;
    private final ProductoRepository productoRepository;
    private final InsumoMapper insumoMapper;

    public List<InsumoDTO> listarInsumos() {
        return insumoRepository.findAll()
                .stream()
                .filter(insumo -> insumo.getEstado() != null && insumo.getEstado() != -1)
                .map(insumoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public InsumoDTO guardarInsumo(InsumoDTO dto) {
        Insumo insumo;

        if (dto.getId() != null) {
            insumo = insumoRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Insumo no encontrado"));

            insumo.setNombre(dto.getNombre());
            insumo.setCategoria(dto.getCategoria());
        } else {
            insumo = insumoMapper.toEntity(dto);
            insumo.setCategoria(dto.getCategoria());
        }

        if (insumo.getEstado() == null) {
            insumo.setEstado(1);
        }

        return insumoMapper.toDTO(insumoRepository.save(insumo));
    }

    @Transactional
    public void eliminarInsumo(Long id) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado con ID: " + id));

        insumoProductoRepository.deleteByInsumoId(id);

        insumo.setEstado(0);
        insumoRepository.saveAndFlush(insumo);
        System.out.println("[La Jama - Logística] Insumo desvinculado de platos y archivado correctamente: " + insumo.getNombre());
    }

    @Transactional
    public void reactivarInsumo(Long id) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado con ID: " + id));

        insumo.setEstado(1);
        insumoRepository.saveAndFlush(insumo);
        System.out.println("[La Jama - Logística] Insumo restaurado a producción: " + insumo.getNombre());
    }

    public List<InsumoDTO> listarInsumosArchivados() {
        return insumoRepository.findAll()
                .stream()
                .filter(insumo -> insumo.getEstado() != null && insumo.getEstado() == 0)
                .map(insumoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<InsumoProductoDTO> listarInsumosPorProducto(Long idProducto) {
        return insumoProductoRepository.findByProductoId(idProducto)
                .stream()
                .map(insumoMapper::toDTODetalle)
                .collect(Collectors.toList());
    }

    public List<InsumoProductoDTO> listarTodosLosInsumosProducto() {
        return insumoProductoRepository.findAll()
                .stream()
                .map(insumoMapper::toDTODetalle)
                .collect(Collectors.toList());
    }

    public InsumoProductoDTO agregarInsumoAProducto(Long idProducto, Long idInsumo) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Insumo insumo = insumoRepository.findById(idInsumo)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado"));

        InsumoProducto ip = new InsumoProducto();
        ip.setProducto(producto);
        ip.setInsumo(insumo);

        return insumoMapper.toDTODetalle(insumoProductoRepository.save(ip));
    }


    @Transactional
    public void eliminarInsumoDeReceta(Long idInsumoProducto) {
        insumoProductoRepository.deleteById(idInsumoProducto);
    }

    @Transactional
    public void limpiarRecetaDeProducto(Long idProducto) {
        insumoProductoRepository.deleteByProductoId(idProducto);
    }

}