package com.web.restaurante.service;

import com.web.restaurante.dto.producto.ProductoRequestDTO;
import com.web.restaurante.model.Producto;
import com.web.restaurante.repository.CategoriaRepository;
import com.web.restaurante.repository.ProductoRepository;
import com.web.restaurante.service.CloudinaryService;
import com.web.restaurante.util.ValidationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerCatalogoInicial() {
        Map<String, Object> response = new HashMap<>();
        response.put("productos", productoRepository.findAll());
        response.put("categorias", categoriaRepository.findAll());
        return response;
    }

    @Transactional(readOnly = true)
    public Producto obtenerPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con el ID: " + id));
    }

    @Transactional
        public Producto guardarOEditar(ProductoRequestDTO dto) {
    validarCamposNegocio(dto);

    Producto producto = new Producto();
    if (dto.getId() != null) {
        producto = productoRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("El producto que intenta editar no existe."));
    }

    producto.setNombre(dto.getNombre().trim());
    producto.setDescripcion(dto.getDescripcion() != null ? dto.getDescripcion().trim() : null);
    producto.setPrecio(dto.getPrecio());
    
    if (dto.getCategoriaId() != null) {
        producto.setCategoria(categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("La categoría especificada no existe.")));
    }

    if (dto.getArchivoImagen() != null && !dto.getArchivoImagen().isEmpty()) {
        validarArchivoImagen(dto.getArchivoImagen());
        try {
            String urlSeguraNube = cloudinaryService.subirImagen(dto.getArchivoImagen());
            producto.setImagen(urlSeguraNube);
        } catch (IOException e) {
            throw new RuntimeException("Error crítico al subir la imagen a Cloudinary.", e);
        }
    }

    if (producto.getEstado() == null) {
        producto.setEstado(1); 
    }

    return productoRepository.save(producto);
    }


    @Transactional
    public void cambiarEstado(Long id, Integer estado) {
        Producto p = obtenerPorId(id);
        p.setEstado(estado);
        productoRepository.save(p);
    }

    @Transactional
    public void eliminarLogico(Long id) {
        Producto p = obtenerPorId(id);
        p.setEstado(0); // Desactivación
        productoRepository.save(p);
    }

    public Map<String, String> validarDatosReactivos(Map<String, Object> datos) {
        Map<String, String> errores = new HashMap<>();
        String nombre = datos.get("nombre") != null ? datos.get("nombre").toString().trim() : "";
        
        if (nombre.isEmpty()) {
            errores.put("nombre", "El nombre es obligatorio.");
        } else if (!ValidationUtil.soloLetras(nombre)) {
            errores.put("nombre", "Solo letras, no se permiten números ni emojis.");
        } else if (!ValidationUtil.longitudValida(nombre, 50)) {
            errores.put("nombre", "El nombre no puede superar 50 caracteres.");
        }

        Object precioObj = datos.get("precio");
        if (precioObj == null || precioObj.toString().isBlank()) {
            errores.put("precio", "El precio es obligatorio.");
        } else {
            try {
                double precio = Double.parseDouble(precioObj.toString());
                if (!ValidationUtil.precioValido(precio)) {
                    errores.put("precio", "El precio debe estar entre S/ " + ValidationUtil.PRECIO_MIN + " y S/ " + ValidationUtil.PRECIO_MAX + ".");
                }
            } catch (NumberFormatException e) {
                errores.put("precio", "Ingresa un número de precio válido.");
            }
        }
        return errores;
    }

    // --- Métodos privados de soporte internos ---
    private void validarCamposNegocio(ProductoRequestDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del plato o producto es obligatorio.");
        }
        if (!ValidationUtil.soloLetras(dto.getNombre())) {
            throw new IllegalArgumentException("El nombre del plato solo puede contener letras.");
        }
        if (!ValidationUtil.longitudValida(dto.getNombre(), 50)) {
            throw new IllegalArgumentException("El nombre del plato no puede superar los 50 caracteres.");
        }
        if (dto.getDescripcion() != null && !ValidationUtil.longitudValida(dto.getDescripcion(), 200)) {
            throw new IllegalArgumentException("La descripción no puede superar los 200 caracteres.");
        }
        if (dto.getPrecio() == null || !ValidationUtil.precioValido(dto.getPrecio())) {
            throw new IllegalArgumentException("El precio está fuera del rango permitido.");
        }
    }

    private void validarArchivoImagen(MultipartFile archivo) {
        long pesoMaximo = 2 * 1024 * 1024;
        if (archivo.getSize() > pesoMaximo) {
            throw new IllegalArgumentException("La imagen supera el tamaño máximo permitido de 2MB.");
        }
        String tipoArchivo = archivo.getContentType();
        if (tipoArchivo == null || (!tipoArchivo.equals("image/jpeg") && !tipoArchivo.equals("image/png") && !tipoArchivo.equals("image/webp"))) {
            throw new IllegalArgumentException("Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.");
        }
    }
}
