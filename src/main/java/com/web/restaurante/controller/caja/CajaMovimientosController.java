package com.web.restaurante.controller.caja;

import com.web.restaurante.dto.caja.MovimientoManualRequest;
import com.web.restaurante.model.MovimientoCaja;
import com.web.restaurante.service.caja.CajaMovimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/caja/movimientos")
@RequiredArgsConstructor
public class CajaMovimientosController {

    private final CajaMovimientoService cajaMovimientoService;

    @PostMapping("/registrar")
    public ResponseEntity<?> registrarMovimiento(@RequestBody MovimientoManualRequest request) {
        try {
            if (request.getMonto() == null || request.getMonto() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "El monto debe ser mayor a cero."));
            }

            MovimientoCaja mov;
            String tipoReq = request.getTipo() != null ? request.getTipo().toUpperCase().trim() : "";

            // 🟢 Acepta tanto 'EGRESO' como 'EGRESO_MANUAL' enviado por React
            if (tipoReq.contains("EGRESO")) {
                mov = cajaMovimientoService.registrarEgresoManual(request.getConcepto(), request.getMonto());
            } else {
                mov = cajaMovimientoService.registrarIngresoManual(request.getConcepto(), request.getMonto());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Movimiento registrado correctamente (" + mov.getTipo() + ")",
                    "movimiento", mov
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}