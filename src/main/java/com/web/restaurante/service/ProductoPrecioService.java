package com.web.restaurante.service;

import com.web.restaurante.dto.productoprecio.ActualizacionPrecioDTO;
import com.web.restaurante.dto.productoprecio.InsumoRefDTO;
import com.web.restaurante.dto.productoprecio.ProductoPrecioDTO;
import com.web.restaurante.mapper.ProductoPrecioMapper;
import com.web.restaurante.model.InsumoProducto;
import com.web.restaurante.model.Producto;
import com.web.restaurante.repository.ProductoPrecioRepository;
import com.web.restaurante.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoPrecioService {

    private final ProductoPrecioRepository productoPrecioRepository;
    private final ProductoRepository productoRepository;
    private final ProductoPrecioMapper productoPrecioMapper;

    @Transactional(readOnly = true)
    public List<ProductoPrecioDTO> listarActivos() {
        List<InsumoProducto> insumoProductos = productoPrecioRepository.listarActivos();

        return insumoProductos.stream()
                .collect(Collectors.groupingBy(InsumoProducto::getProducto))
                .entrySet()
                .stream()
                .map(entry -> {
                    Producto producto = entry.getKey();

                    List<InsumoRefDTO> insumos = entry.getValue().stream()
                            .map(productoPrecioMapper::toDTORef)
                            .toList();

                    return new ProductoPrecioDTO(
                            producto.getId(),
                            producto.getImagen(),
                            producto.getNombre(),
                            producto.getPrecio(),
                            insumos
                    );
                }).toList();
    }

    @Transactional
    public void actualizarPrecios(List<ActualizacionPrecioDTO> actualizaciones) {
        for (ActualizacionPrecioDTO actualizacion : actualizaciones) {
            productoRepository.findById(actualizacion.idProducto())
                    .ifPresent(p -> p.setPrecio(actualizacion.nuevoPrecio()));
        }
    }
}
