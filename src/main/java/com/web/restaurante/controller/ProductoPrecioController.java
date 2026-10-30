
package com.web.restaurante.controller;

import com.web.restaurante.dto.productoprecio.ActualizacionPrecioDTO;
import com.web.restaurante.service.ProductoPrecioService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/productos-precios")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoPrecioController {

    private final ProductoPrecioService productoPrecioService;

    @GetMapping("/listar")
    public ResponseEntity<?> listar() {
        return ResponseUtil.ok(
                "Precios de productos encontrados",
                productoPrecioService.listarActivos()
        );
    }

    @PostMapping("/actualizar-precios")
    public ResponseEntity<?> guardar(
            @RequestBody List<ActualizacionPrecioDTO> actualizaciones) {
        try {
            productoPrecioService.actualizarPrecios(actualizaciones);
            return ResponseUtil.ok("Datos actualizados correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensaje", "Error al actualizar el lote de precios."));
        }
    }
}
