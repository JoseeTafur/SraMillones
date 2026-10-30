package com.web.restaurante.controller;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.service.ComandaService;
import com.web.restaurante.repository.ComandaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comandas")
@RequiredArgsConstructor
public class ComandaController {

    private final ComandaService comandaService;
    private final ComandaRepository comandaRepository;

    @GetMapping("/mesa/{numeroMesa}")
    public ResponseEntity<?> obtenerComandaMesa(@PathVariable Integer numeroMesa) {
        return comandaService.obtenerPorMesa(numeroMesa)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @PostMapping("/guardar/{numeroMesa}")
    public ResponseEntity<?> guardarComanda(@RequestBody Comanda comanda, @PathVariable Integer numeroMesa) {
        try {
            Comanda guardada = comandaService.guardarOCambiarComanda(comanda, numeroMesa);
            return ResponseEntity.ok(Map.of("success", true, "comandaId", guardada.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/trasladar")
    public ResponseEntity<?> trasladarComandaCompleta(@RequestParam Integer mesaOrigen, @RequestParam Integer mesaDestino) {
        try {
            comandaService.trasladarComandaCompleta(mesaOrigen, mesaDestino);
            return ResponseEntity.ok(Map.of("success", true, "message", "Comanda trasladada con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/dividir")
    public ResponseEntity<?> dividirComandaParcial(@RequestParam Integer mesaOrigen,
                                                   @RequestParam Integer mesaDestino,
                                                   @RequestBody List<Long> idsDetalles) {
        try {
            comandaService.dividirComandaParcial(mesaOrigen, mesaDestino, idsDetalles);
            return ResponseEntity.ok(Map.of("success", true, "message", "Comanda dividida con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/por-cobrar")
public ResponseEntity<?> listarComandasPorCobrar() {
    return ResponseEntity.ok(comandaRepository.findComandasConItemsPendientesPago());
    }

    @PostMapping("/liberar/{numeroMesa}")
    public ResponseEntity<?> liberarMesaManual(@PathVariable Integer numeroMesa) {
        try {
            comandaService.liberarMesaManual(numeroMesa);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mesa #" + numeroMesa + " liberada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/detalle/{detalleId}")
public ResponseEntity<?> eliminarDetalleComanda(@PathVariable Long detalleId) {
    try {
        comandaService.eliminarDetalleComanda(detalleId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Ítem eliminado de la comanda."));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
    }
}
}