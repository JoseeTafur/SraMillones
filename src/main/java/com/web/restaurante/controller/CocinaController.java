package com.web.restaurante.controller;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.service.CocinaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cocina")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CocinaController {

    private final CocinaService cocinaService;

    // GET principal consumido por CocinaPage.jsx
    @GetMapping("/monitor")
    public ResponseEntity<List<Comanda>> verMonitor() {
        return ResponseEntity.ok(cocinaService.listarPedidosActivos());
    }

    // Alias para compatibilidad
    @GetMapping("/pedidos")
    public ResponseEntity<List<Comanda>> obtenerPedidosActivos() {
        return ResponseEntity.ok(cocinaService.listarPedidosActivos());
    }

    @PostMapping("/ticket/{pedidoId}")
    public ResponseEntity<Map<String, Object>> procesarImpresionTicket(@PathVariable Long pedidoId) {
        cocinaService.obtainTicket(pedidoId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Ticket procesado correctamente."));
    }

    @PostMapping("/completar")
    public ResponseEntity<?> completarPedido(@RequestParam Long pedidoId) {
        try {
            cocinaService.despacharLoteEstacion(pedidoId, "GENERAL");
            return ResponseEntity.ok(Map.of("mensaje", "Comanda despachada correctamente."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/entregar-item")
    public ResponseEntity<?> entregarItemIndividual(@RequestParam Long pedidoId, @RequestParam Long detalleId) {
        try {
            cocinaService.entregarItemFila(pedidoId, detalleId);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/completar-item")
    public ResponseEntity<?> completarItemIndividual(@RequestParam Long pedidoId, @RequestParam Long detalleId) {
        try {
            cocinaService.despacharItemFila(pedidoId, detalleId);
            return ResponseEntity.ok("OK");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}