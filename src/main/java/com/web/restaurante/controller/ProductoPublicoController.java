package com.web.restaurante.controller;

import com.web.restaurante.service.GroqVoucherService;
import com.web.restaurante.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/public/carta")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoPublicoController {

    private final ProductoService productoService;
    private final GroqVoucherService groqVoucherService;

    @GetMapping
    public ResponseEntity<?> obtenerCartaPublica() {
        return ResponseEntity.ok(productoService.obtenerCatalogoInicial());
    }

    // El frontend envía "file" y "total", y espera { valido, monto, mensaje }
    @PostMapping(value = "/validar-voucher", consumes = "multipart/form-data")
    public ResponseEntity<?> validarVoucher(
            @RequestParam("file") MultipartFile file,
            @RequestParam("total") double total) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valido", false,
                    "monto", 0.0,
                    "mensaje", "Falta adjuntar el voucher."));
        }

        Map<String, Object> r = groqVoucherService.validarVoucher(file, total);

        return ResponseEntity.ok(Map.of(
                "valido", r.get("valido"),
                "monto", r.get("montoDetectado"),
                "mensaje", r.get("mensaje")));
    }
}