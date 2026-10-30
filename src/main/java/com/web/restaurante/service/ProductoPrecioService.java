
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoPrecioService {

    private final ProductoPrecioRepository productoPrecioRepository;
    private final ProductoRepository productoRepository;
    private final ProductoPrecioMapper productoPrecioMapper;

    // Listar productos activos con sus insumos
    @Transactional(readOnly = true)
    public List<ProductoPrecioDTO> listarActivos() {

        List<Producto> productos = productoRepository.findByEstado(1);

        List<InsumoProducto> insumoProductos =
                productoPrecioRepository.listarActivos();

        Map<Long, List<InsumoProducto>> insumosPorProducto =
                insumoProductos.stream()
                        .collect(Collectors.groupingBy(
                                ip -> ip.getProducto().getId()
                        ));

        return productos.stream()
                .map(producto -> {

                    List<InsumoRefDTO> insumos =
                            insumosPorProducto
                                    .getOrDefault(producto.getId(), List.of())
                                    .stream()
                                    .map(productoPrecioMapper::toDTORef)
                                    .toList();

                    return new ProductoPrecioDTO(
                            producto.getId(),
                            producto.getImagen(),
                            producto.getNombre(),
                            producto.getPrecio(),
                            insumos
                    );
                })
                .toList();
    }

    // Actualizar precios masivamente
   
    @Transactional
    public void actualizarPrecios(List<ActualizacionPrecioDTO> actualizaciones) {
        if (actualizaciones == null) {
            throw new IllegalArgumentException("La lista de actualizaciones no puede ser nula.");
        }

        for (ActualizacionPrecioDTO actualizacion : actualizaciones) {
            if (actualizacion == null
                    || actualizacion.idProducto() == null
                    || actualizacion.nuevoPrecio() == null) {
                throw new IllegalArgumentException("Los datos de actualización son obligatorios.");
            }

            productoRepository.findById(actualizacion.idProducto())
                    .ifPresent(producto ->
                            producto.setPrecio(actualizacion.nuevoPrecio())
                    );
        }
    }
 }