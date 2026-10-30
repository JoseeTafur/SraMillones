package com.web.restaurante.controller;

import com.web.restaurante.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/carta")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoPublicoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<?> obtenerCartaPublica() {
        return ResponseEntity.ok(productoService.obtenerCatalogoInicial());
    }
}