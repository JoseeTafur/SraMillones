package com.web.restaurante.controller;

import com.web.restaurante.dto.productoprecio.ActualizacionPrecioDTO;
import com.web.restaurante.service.ProductoPrecioService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
public class ProductoPrecioController {

    private final ProductoPrecioService productoPrecioService;

    @GetMapping
    public String pagina(Model model) {
        model.addAttribute("activeUri", "/admin/productos-precios");
        model.addAttribute("titleHeader", "Precios de Productos y Platos");

        model.addAttribute("productos", productoPrecioService.listarActivos());
        return "admin/productos_ajuste_precios";
    }

    @GetMapping("/api/listar")
    public ResponseEntity<?> listar() {
        return ResponseUtil.ok("Precios de productos encontrados", productoPrecioService.listarActivos());
    }

    @PostMapping("/api/actualizar-precios")
    public ResponseEntity<?> guardar(@RequestBody List<ActualizacionPrecioDTO> actualizaciones) {
        productoPrecioService.actualizarPrecios(actualizaciones);
        return ResponseUtil.ok("Datos actualizados correctamente");
    }
}
