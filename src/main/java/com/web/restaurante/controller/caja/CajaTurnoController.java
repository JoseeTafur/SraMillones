package com.web.restaurante.controller.caja;

import com.web.restaurante.dto.caja.AperturaCajaRequest;
import com.web.restaurante.dto.caja.CierreCajaRequest;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.service.MesaService;
import com.web.restaurante.service.caja.TurnoCoreService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/caja/turno")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CajaTurnoController {

    private final TurnoCoreService turnoCoreService;
    private final MesaService mesaService;

    @GetMapping("/estado")
    public ResponseEntity<?> obtenerEstadoActual() {
        Optional<TurnoCaja> turnoOpt = turnoCoreService.obtenerTurnoActivo();
        Map<String, Object> response = new HashMap<>();

        if (turnoOpt.isEmpty()) {
            response.put("cajaAbierta", false);
            response.put("montoSugerido", turnoCoreService.obtenerMontoAperturaSugerido());
            response.put("horarioPermitido", turnoCoreService.esHorarioPermitido(LocalTime.now()));
            return ResponseEntity.ok(response);
        }

        TurnoCaja turnoActivo = turnoOpt.get();
        Map<String, Object> metricas = turnoCoreService.calcularMetricas(turnoActivo);

        response.put("cajaAbierta", true);
        response.put("turno", turnoActivo);
        response.put("metricas", metricas);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirTurno(@RequestBody AperturaCajaRequest request, HttpSession session) {
        try {
            String rol = (String) session.getAttribute("rol");
            if (rol == null) rol = "CAJERO";

            TurnoCaja turno = turnoCoreService.abrirTurno(request, rol);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Caja abierta correctamente con un fondo de S/ " + turno.getMontoApertura(),
                    "turno", turno
            ));
        } catch (IllegalStateException e) {
            boolean requiereConfirmacion = e.getMessage() != null && e.getMessage().startsWith("REQUIERE_CONFIRMACION_FORZADA");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "requiereConfirmacionForzada", requiereConfirmacion,
                    "message", e.getMessage().replace("REQUIERE_CONFIRMACION_FORZADA: ", "")
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/cerrar")
    public ResponseEntity<?> cerrarTurno(@RequestBody CierreCajaRequest request, HttpSession session) {
        try {
            String rol = (String) session.getAttribute("rol");
            String turnoEmp = (String) session.getAttribute("empleadoTurno");

            TurnoCaja turnoCerrado = turnoCoreService.cerrarTurno(request, rol, turnoEmp);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Caja cerrada correctamente. Descuadre registrado: S/ " + turnoCerrado.getDiferencia(),
                    "turno", turnoCerrado
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/cobrar/{comandaId}")
    public ResponseEntity<?> cobrarComanda(
            @PathVariable Long comandaId,
            @RequestBody Map<String, Object> payload,
            HttpSession session) {
        try {
            Long mesaId = payload.get("mesaId") != null ? Long.valueOf(payload.get("mesaId").toString()) : null;
            List<Map<String, Object>> tickets = (List<Map<String, Object>>) payload.get("tickets");

            if (tickets != null && !tickets.isEmpty()) {
                for (Map<String, Object> ticket : tickets) {
                    List<Long> idsDetalles = new ArrayList<>();
                    if (ticket.get("itemsIncluidos") instanceof List<?>) {
                        for (Object item : (List<?>) ticket.get("itemsIncluidos")) {
                            idsDetalles.add(Long.valueOf(item.toString()));
                        }
                    }

                    MetodoPago metodoEnum = MetodoPago.EFECTIVO;
                    if (ticket.get("metodoPago") != null) {
                        try {
                            metodoEnum = MetodoPago.valueOf(ticket.get("metodoPago").toString().toUpperCase().trim());
                        } catch (Exception ignored) {}
                    }

                    String nombreCliente = ticket.get("nombreCliente") != null 
                            ? ticket.get("nombreCliente").toString().toUpperCase().trim() 
                            : "CLIENTE";

                    // 🟢 Pasa el nombreCliente a la transacción de cobro
                    mesaService.procesarCobro(comandaId, mesaId, idsDetalles, metodoEnum, nombreCliente);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Comanda #" + comandaId + " cobrada y liquidada con éxito."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Error al procesar cobro: " + e.getMessage()));
        }
    }
}