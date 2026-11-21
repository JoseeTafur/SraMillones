package com.web.restaurante.service.caja;

import com.web.restaurante.model.MovimientoCaja;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.TipoMovimientoCaja;
import com.web.restaurante.repository.MovimientoCajaRepository;
import com.web.restaurante.repository.PedidoRepository;
import com.web.restaurante.repository.TurnoCajaRepository;
import com.web.restaurante.service.AuditoriaService;
import com.web.restaurante.service.CierreCajaSequenceService;
import com.web.restaurante.service.MovimientoSequenceService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurnoCajaService {

    private final TurnoCajaRepository turnoCajaRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final TurnoSequenceService turnoSequenceService;
    private final MovimientoSequenceService movimientoSequenceService;
    private final CierreCajaSequenceService cierreCajaSequenceService;
    private final PedidoRepository pedidoRepository;
    private final AuditoriaService auditoriaService;

    public Optional<TurnoCaja> obtenerTurnoActivo() {
        return turnoCajaRepository.findByActivoTrue();
    }

    public Double obtenerMontoAperturaSugerido() {
        List<TurnoCaja> cerrados = turnoCajaRepository.findTurnosCerradosOrdenados();
        if (cerrados.isEmpty()) return 200.0;

        Double montoCierre = cerrados.get(0).getMontoCierre();
        return montoCierre != null ? montoCierre : 200.0;
    }

    public List<MovimientoCaja> obtenerMovimientosDelTurnoActivo() {
        return turnoCajaRepository.findByActivoTrue()
                .map(t -> movimientoCajaRepository.findByTurnoIdOrderByFechaAsc(t.getId()))
                .orElse(List.of());
    }

    @Transactional
    public TurnoCaja abrirTurno(Double montoApertura) {
        if (turnoCajaRepository.findByActivoTrue().isPresent()) {
            throw new IllegalStateException("Ya hay un turno de caja abierto. Debes cerrarlo primero.");
        }

        TurnoCaja turno = new TurnoCaja();
        turno.setMontoApertura(montoApertura);

        LocalDateTime ahora = LocalDateTime.now();
        turno.setFechaApertura(ahora);
        turno.setActivo(true);

        // SRA MILLONES opera con Turno Único continuo
        turno.setTipoTurno("ÚNICO");

        turnoCajaRepository.save(turno);

        String serieApertura = turnoSequenceService.generarSiguienteTurno();
        registrarMovimiento(turno, TipoMovimientoCaja.APERTURA, "Fondo inicial", montoApertura, serieApertura);

        auditoriaService.registrar(
                "CAJA",
                "APERTURA_CAJA",
                "TurnoCaja",
                turno.getId(),
                "Apertura de turno de caja #" + turno.getId() + " (" + serieApertura + ") con fondo S/ " + String.format("%.2f", montoApertura),
                "Caja: CERRADA",
                "Turno #" + turno.getId() + " ACTIVO | Fondo: S/ " + String.format("%.2f", montoApertura)
        );

        return turno;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarVenta(String concepto, Double monto) {
        turnoCajaRepository.findByActivoTrue().ifPresent(turno ->
                registrarMovimiento(turno, TipoMovimientoCaja.INGRESO_VENTA, concepto, monto, null)
        );
    }

    @Transactional
    public void registrarEgreso(String concepto, Double monto) {
        TurnoCaja turno = turnoCajaRepository.findByActivoTrue()
                .orElseThrow(() -> new IllegalStateException("No hay turno activo."));
        String serieMovimiento = movimientoSequenceService.generarSiguienteMovimiento();
        registrarMovimiento(turno, TipoMovimientoCaja.EGRESO_MANUAL, concepto, -Math.abs(monto), serieMovimiento);

        auditoriaService.registrar(
                "CAJA",
                "EGRESO_MANUAL_CAJA",
                "MovimientoCaja",
                turno.getId(),
                "Egreso manual en caja (" + serieMovimiento + "): -S/ " + String.format("%.2f", Math.abs(monto)) + " - " + concepto,
                null,
                "Monto: -S/ " + String.format("%.2f", Math.abs(monto)) + " | Concepto: " + concepto
        );
    }

    @Transactional
    public void registrarIngresoManual(String concepto, Double monto) {
        TurnoCaja turno = turnoCajaRepository.findByActivoTrue()
                .orElseThrow(() -> new IllegalStateException("No hay turno activo."));
        String serieMovimiento = movimientoSequenceService.generarSiguienteMovimiento();
        registrarMovimiento(turno, TipoMovimientoCaja.INGRESO_MANUAL, concepto, Math.abs(monto), serieMovimiento);

        auditoriaService.registrar(
                "CAJA",
                "INGRESO_MANUAL_CAJA",
                "MovimientoCaja",
                turno.getId(),
                "Ingreso manual en caja (" + serieMovimiento + "): +S/ " + String.format("%.2f", Math.abs(monto)) + " - " + concepto,
                null,
                "Monto: +S/ " + String.format("%.2f", Math.abs(monto)) + " | Concepto: " + concepto
        );
    }

    @Transactional
    public TurnoCaja cerrarTurno(Double montoCierre, String observaciones) {
        TurnoCaja turno = turnoCajaRepository.findByActivoTrue()
                .orElseThrow(() -> new IllegalStateException("No hay ningun turno de caja abierto."));

        List<MovimientoCaja> movimientos = movimientoCajaRepository.findByTurnoIdOrderByFechaAsc(turno.getId());

        List<Pedido> pedidosTurno = pedidoRepository.findAll().stream()
                .filter(p -> p.getTurnoCaja() != null && p.getTurnoCaja().getId().equals(turno.getId()))
                .filter(p -> com.web.restaurante.model.enums.EstadoPago.PAGADO.equals(p.getEstadoPago()))
                .filter(p -> p.getComprobanteNotaNumero() != null && !p.getComprobanteNotaNumero().trim().isEmpty())
                .collect(Collectors.toList());

        double totalVendido = 0.0;
        for (Pedido p : pedidosTurno) {
            double monto = p.getMontoTotal() != null ? p.getMontoTotal() : 0.0;
            totalVendido += monto;
        }

        double totalIngresosManuales = 0.0;
        double totalEgresosManuales = 0.0;

        for (MovimientoCaja m : movimientos) {
            if (m.getTipo() == TipoMovimientoCaja.INGRESO_MANUAL) {
                totalIngresosManuales += m.getMonto();
            } else if (m.getTipo() != null && m.getTipo().getGrupoMacro().equals("EGRESO") && m.getTipo() != TipoMovimientoCaja.CIERRE) {
                totalEgresosManuales += m.getMonto();
            }
        }

        double saldoTeorico = turno.getMontoApertura() + totalVendido + totalIngresosManuales + totalEgresosManuales;
        double diferencia = montoCierre - saldoTeorico;

        String serieCierre = cierreCajaSequenceService.generarSiguienteCierreCaja();
        registrarMovimiento(turno, TipoMovimientoCaja.CIERRE, "Cierre estricto de caja por el operador", montoCierre, serieCierre);

        turno.setMontoCierre(montoCierre);
        turno.setTotalVendido(totalVendido);
        turno.setDiferencia(diferencia);
        turno.setObservaciones(observaciones);
        turno.setFechaCierre(LocalDateTime.now());
        turno.setActivo(false);

        TurnoCaja cerrado = turnoCajaRepository.save(turno);

        auditoriaService.registrar(
                "CAJA",
                "CIERRE_CAJA",
                "TurnoCaja",
                cerrado.getId(),
                "Cierre de turno #" + cerrado.getId() + " (" + serieCierre + ") | Declarado: S/ " + String.format("%.2f", montoCierre) + " | Diferencia: S/ " + String.format("%.2f", diferencia),
                "Saldo teórico: S/ " + String.format("%.2f", saldoTeorico),
                "Monto cierre: S/ " + String.format("%.2f", montoCierre) + " | Diferencia: S/ " + String.format("%.2f", diferencia)
        );

        return cerrado;
    }

    private void registrarMovimiento(TurnoCaja turno, TipoMovimientoCaja tipo,
                                     String concepto, Double monto, String comprobante) {
        MovimientoCaja mov = new MovimientoCaja();
        mov.setTurno(turno);
        mov.setTipo(tipo);
        mov.setConcepto(concepto);
        mov.setMonto(monto);
        mov.setComprobante(comprobante);
        mov.setFecha(LocalDateTime.now());
        mov.setMetodoPago(com.web.restaurante.model.enums.MetodoPago.EFECTIVO);
        movimientoCajaRepository.save(mov);
    }
}