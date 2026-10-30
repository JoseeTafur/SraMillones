package com.web.restaurante.controller;

import com.web.restaurante.dto.producto.ProductoRequestDTO;
import com.web.restaurante.model.Producto;
import com.web.restaurante.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/productos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar() {
        return ResponseEntity.ok(productoService.obtenerCatalogoInicial());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productoService.obtenerPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(value = "/guardar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> guardar(@ModelAttribute ProductoRequestDTO dto) {
        try {
            Producto productoGuardado = productoService.guardarOEditar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(productoGuardado);
        } catch (IllegalArgumentException e) {
            // Maneja los errores de negocio controlados de Validación
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (RuntimeException e) {
            // Maneja fallos de Cloudinary o de base de datos
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/estado/{id}")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam Integer estado) {
        try {
            productoService.cambiarEstado(id, estado);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            productoService.eliminarLogico(id);
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Producto desactivado correctamente.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/validar")
    public ResponseEntity<?> validarProducto(@RequestBody Map<String, Object> datos) {
        Map<String, String> errores = productoService.validarDatosReactivos(datos);
        Map<String, Object> response = new HashMap<>();
        response.put("valido", errores.isEmpty());
        if (!errores.isEmpty()) response.put("errores", errores);
        return ResponseEntity.ok(response);
    }
}
