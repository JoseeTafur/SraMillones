package com.web.restaurante.controller;

import com.web.restaurante.dto.productoprecio.ActualizacionPrecioDTO;
import com.web.restaurante.service.ProductoPrecioService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
<<<<<<< HEAD
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin/productos-precios")
@RequiredArgsConstructor
=======
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController 
@RequestMapping("/api/admin/productos-precios") 
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") 
>>>>>>> b3e9bad3807125454ee5751a1dc7cb85750c5ba0
public class ProductoPrecioController {

    private final ProductoPrecioService productoPrecioService;

<<<<<<< HEAD
    @GetMapping
    public String pagina(Model model) {
        model.addAttribute("activeUri", "/admin/productos-precios");
        model.addAttribute("titleHeader", "Precios de Productos y Platos");

        model.addAttribute("productos", productoPrecioService.listarActivos());
        return "admin/productos_ajuste_precios";
    }

    @GetMapping("/api/listar")
=======
    /** 📊 GET: Lista todos los productos activos con sus precios */
    @GetMapping("/listar")
>>>>>>> b3e9bad3807125454ee5751a1dc7cb85750c5ba0
    public ResponseEntity<?> listar() {
        return ResponseUtil.ok("Precios de productos encontrados", productoPrecioService.listarActivos());
    }

<<<<<<< HEAD
    @PostMapping("/api/actualizar-precios")
    public ResponseEntity<?> guardar(@RequestBody List<ActualizacionPrecioDTO> actualizaciones) {
        productoPrecioService.actualizarPrecios(actualizaciones);
        return ResponseUtil.ok("Datos actualizados correctamente");
=======
    /** 💾 POST: Recibe la lista masiva de cambios desde React y los procesa en lote */
    @PostMapping("/actualizar-precios")
    public ResponseEntity<?> guardar(@RequestBody List<ActualizacionPrecioDTO> actualizaciones) {
        try {
            // ↵ CORREGIDO: Cambiado 'updates' por 'actualizaciones'
            productoPrecioService.actualizarPrecios(actualizaciones); 
            return ResponseUtil.ok("Datos actualizados correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("mensaje", "Error al actualizar el lote de precios."));
        }
>>>>>>> b3e9bad3807125454ee5751a1dc7cb85750c5ba0
    }
}
