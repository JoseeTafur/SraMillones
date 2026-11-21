package com.web.restaurante.service.caja;

import com.web.restaurante.model.MovimientoCaja;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.TipoMovimientoCaja;
import com.web.restaurante.repository.MovimientoCajaRepository;
import com.web.restaurante.repository.TurnoCajaRepository;
import com.web.restaurante.service.AuditoriaService;
import com.web.restaurante.service.MovimientoSequenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CajaMovimientoService {

    private final MovimientoCajaRepository movimientoCajaRepository;
    private final TurnoCajaRepository turnoCajaRepository;
    private final MovimientoSequenceService movimientoSequenceService;
    private final AuditoriaService auditoriaService;

    @Transactional
    public MovimientoCaja registrarIngresoManual(String concepto, Double monto) {
        TurnoCaja turno = turnoCajaRepository.findByActivoTrue()
                .orElseThrow(() -> new IllegalStateException("No hay turno activo para registrar el ingreso."));

        String serie = movimientoSequenceService.generarSiguienteMovimiento();
        MovimientoCaja mov = registrarMovimientoInterno(
                turno,
                TipoMovimientoCaja.INGRESO_MANUAL,
                "Manual: " + concepto,
                Math.abs(monto),
                serie,
                MetodoPago.EFECTIVO
        );

        auditoriaService.registrar(
                "CAJA",
                "INGRESO_MANUAL_CAJA",
                "MovimientoCaja",
                mov.getId(),
                "Ingreso manual en caja (" + serie + "): +S/ " + String.format("%.2f", Math.abs(monto)) + " - " + concepto,
                null,
                "Turno #" + turno.getId() + " | Serie: " + serie + " | Monto: +S/ " + String.format("%.2f", Math.abs(monto)) + " | Concepto: " + concepto
        );

        return mov;
    }

    @Transactional
    public MovimientoCaja registrarEgresoManual(String concepto, Double monto) {
        TurnoCaja turno = turnoCajaRepository.findByActivoTrue()
                .orElseThrow(() -> new IllegalStateException("No hay turno activo para registrar el egreso."));

        String serie = movimientoSequenceService.generarSiguienteMovimiento();
        MovimientoCaja mov = registrarMovimientoInterno(
                turno,
                TipoMovimientoCaja.EGRESO_MANUAL,
                "Manual: " + concepto,
                -Math.abs(monto),
                serie,
                MetodoPago.EFECTIVO
        );

        auditoriaService.registrar(
                "CAJA",
                "EGRESO_MANUAL_CAJA",
                "MovimientoCaja",
                mov.getId(),
                "Egreso/retiro manual en caja (" + serie + "): -S/ " + String.format("%.2f", Math.abs(monto)) + " - " + concepto,
                null,
                "Turno #" + turno.getId() + " | Serie: " + serie + " | Monto: -S/ " + String.format("%.2f", Math.abs(monto)) + " | Concepto: " + concepto
        );

        return mov;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarVentaAutomatica(String concepto, Double monto, MetodoPago metodoPago, String comprobante) {
        turnoCajaRepository.findByActivoTrue().ifPresent(turno ->
                registrarMovimientoInterno(turno, TipoMovimientoCaja.INGRESO_VENTA, concepto, Math.abs(monto), comprobante, metodoPago)
        );
    }

    // 🟢 Recibe el MetodoPago real seleccionado en la modal
    @Transactional
    public MovimientoCaja registrarMovimientoInterno(TurnoCaja turno, TipoMovimientoCaja tipo,
                                                      String concepto, Double monto, String comprobante, MetodoPago metodoPago) {
        MovimientoCaja mov = new MovimientoCaja();
        mov.setTurno(turno);
        mov.setTipo(tipo);
        mov.setConcepto(concepto);
        mov.setMonto(monto);
        mov.setComprobante(comprobante);
        mov.setFecha(LocalDateTime.now());

        // 🟢 Asigna el Enum de MySQL dinámico (EFECTIVO, YAPE, PLIN, TARJETA)
        mov.setMetodoPago(metodoPago != null ? metodoPago : MetodoPago.EFECTIVO);
        return movimientoCajaRepository.save(mov);
    }
}