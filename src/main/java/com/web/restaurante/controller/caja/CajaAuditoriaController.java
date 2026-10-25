package com.web.restaurante.controller.caja;

import com.web.restaurante.model.MovimientoCaja;
import com.web.restaurante.model.Venta;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.repository.MovimientoCajaRepository;
import com.web.restaurante.repository.TurnoCajaRepository;
import com.web.restaurante.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/caja/auditoria")
@RequiredArgsConstructor
public class CajaAuditoriaController {

    private final TurnoCajaRepository turnoCajaRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final VentaRepository ventaRepository;

    @GetMapping("/historial-turnos")
    public ResponseEntity<?> obtenerHistorialTurnos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            LocalDateTime inicio = fechaInicio.atStartOfDay();
            LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);

            // 🟢 Usa la consulta personalizada con filtro t.activo = false
            List<TurnoCaja> turnos = turnoCajaRepository.findTurnosCerradosEnRangoHorario(inicio, fin);

            List<Map<String, Object>> respuesta = turnos.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("fechaApertura", t.getFechaApertura());
                map.put("fechaCierre", t.getFechaCierre());
                map.put("montoApertura", t.getMontoApertura());
                map.put("montoCierre", t.getMontoCierre());
                map.put("observaciones", t.getObservaciones());

                List<MovimientoCaja> movs = movimientoCajaRepository.findByTurnoIdOrderByFechaAsc(t.getId());

                double totalVentas = movs.stream()
                        .filter(m -> "INGRESO_VENTA".equals(m.getTipo()) || (m.getConcepto() != null && m.getConcepto().toLowerCase().contains("venta")))
                        .mapToDouble(MovimientoCaja::getMonto)
                        .sum();

                double ventasYape = movs.stream()
                        .filter(m -> m.getMetodoPago() != null && "YAPE".equalsIgnoreCase(m.getMetodoPago().name()))
                        .mapToDouble(MovimientoCaja::getMonto).sum();

                double ventasPlin = movs.stream()
                        .filter(m -> m.getMetodoPago() != null && "PLIN".equalsIgnoreCase(m.getMetodoPago().name()))
                        .mapToDouble(MovimientoCaja::getMonto).sum();

                double ventasTarjeta = movs.stream()
                        .filter(m -> m.getMetodoPago() != null && "TARJETA".equalsIgnoreCase(m.getMetodoPago().name()))
                        .mapToDouble(MovimientoCaja::getMonto).sum();

                double egresosManuales = movs.stream()
                        .filter(m -> "EGRESO_MANUAL".equals(m.getTipo()))
                        .mapToDouble(MovimientoCaja::getMonto).sum();

                double efectivoEsperado = (t.getMontoApertura() != null ? t.getMontoApertura() : 0.0) +
                        movs.stream().filter(m -> m.getMetodoPago() == null || "EFECTIVO".equalsIgnoreCase(m.getMetodoPago().name()))
                                .mapToDouble(MovimientoCaja::getMonto).sum();

                Map<String, Object> metricas = new HashMap<>();
                metricas.put("totalVentas", totalVentas);
                metricas.put("ventasYape", ventasYape);
                metricas.put("ventasPlin", ventasPlin);
                metricas.put("ventasTarjeta", ventasTarjeta);
                metricas.put("egresosManuales", egresosManuales);
                metricas.put("efectivoEsperadoGaveta", efectivoEsperado);

                map.put("metricas", metricas);
                return map;
            }).toList();

            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    

    @GetMapping("/venta-detalle/{movimientoId}")
    @Transactional(readOnly = true) // 🟢 Permite la carga Lazy de los detalles de la venta sin lazy initialization error
    public ResponseEntity<?> obtenerDetalleVentaPorMovimiento(@PathVariable Long movimientoId) {
        try {
            MovimientoCaja mov = movimientoCajaRepository.findById(movimientoId)
                    .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

            String comprobanteMov = mov.getComprobante();
            Optional<Venta> ventaOpt = Optional.empty();

            // 1. Intento por número de comprobante exacto
            if (comprobanteMov != null && !comprobanteMov.trim().isEmpty()) {
                ventaOpt = ventaRepository.findByNumeroComprobante(comprobanteMov);
            }

            // 2. Si es TICKET-X o no se encontró, busca en las ventas asociadas al mismo turno de caja
            if (ventaOpt.isEmpty() && mov.getTurno() != null) {
                List<Venta> ventasTurno = ventaRepository.findByTurnoCajaId(mov.getTurno().getId());
                
                // Intenta matchear por el comprobante secundario (ej. "NV01-...") que aparece en el concepto
                ventaOpt = ventasTurno.stream()
                        .filter(v -> v.getNumeroComprobante() != null && mov.getConcepto() != null 
                                && mov.getConcepto().contains(v.getNumeroComprobante()))
                        .findFirst();

                // Si aún no lo encuentra, toma la venta por monto y método de pago coincidente
                if (ventaOpt.isEmpty()) {
                    ventaOpt = ventasTurno.stream()
                            .filter(v -> Objects.equals(v.getMontoTotal(), mov.getMonto()) 
                                    || (v.getMetodoPago() != null && v.getMetodoPago() == mov.getMetodoPago()))
                            .findFirst();
                }
            }

            if (ventaOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "tipo", "MANUAL",
                        "comprobante", mov.getComprobante() != null ? mov.getComprobante() : "S/N",
                        "concepto", mov.getConcepto(),
                        "monto", Math.abs(mov.getMonto() != null ? mov.getMonto() : 0.0),
                        "detalles", List.of()
                ));
            }

            Venta venta = ventaOpt.get();
            List<Map<String, Object>> detallesDTO = venta.getDetalles().stream().map(d -> {
                Map<String, Object> map = new HashMap<>();
                map.put("producto", d.getNombreProducto() != null ? d.getNombreProducto() : "Platillo");
                map.put("cantidad", d.getCantidad() != null ? d.getCantidad() : 1);
                map.put("precioUnitario", d.getPrecioUnitario() != null ? d.getPrecioUnitario() : 0.0);
                map.put("subtotal", d.getSubtotal() != null ? d.getSubtotal() : 0.0);
                return map;
            }).toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tipo", "VENTA",
                    "comprobante", venta.getNumeroComprobante() != null ? venta.getNumeroComprobante() : "NV-S/N",
                    "mesa", venta.getNumeroMesa() != null ? "Mesa #" + venta.getNumeroMesa() : "Para Llevar / Salón",
                    "metodoPago", venta.getMetodoPago() != null ? venta.getMetodoPago().name() : "EFECTIVO",
                    "montoTotal", venta.getMontoTotal() != null ? venta.getMontoTotal() : 0.0,
                    "detalles", detallesDTO
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/turno/{idTurno}")
    public ResponseEntity<?> obtenerEstadoCajaPorTurno(@PathVariable Long idTurno) {
        try {
            List<MovimientoCaja> movs = movimientoCajaRepository.findByTurnoIdOrderByFechaAsc(idTurno);

            Map<String, Object> metricas = new HashMap<>();
            metricas.put("movimientos", movs);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("metricas", metricas);

            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}