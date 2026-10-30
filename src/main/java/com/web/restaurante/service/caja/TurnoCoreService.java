package com.web.restaurante.service.caja;

import com.web.restaurante.dto.caja.AperturaCajaRequest;
import com.web.restaurante.dto.caja.CierreCajaRequest;
import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.DetalleComanda;
import com.web.restaurante.model.MovimientoCaja;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.EstadoComanda;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.TipoMovimientoCaja;
import com.web.restaurante.repository.MovimientoCajaRepository;
import com.web.restaurante.repository.TurnoCajaRepository;
import com.web.restaurante.repository.ComandaRepository;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.service.CierreCajaSequenceService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TurnoCoreService {

    private final TurnoCajaRepository turnoCajaRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final TurnoSequenceService turnoSequenceService;
    private final CierreCajaSequenceService cierreCajaSequenceService;
    private final CajaMovimientoService cajaMovimientoService;
    private final ComandaRepository comandaRepository;
    private final MesaRepository mesaRepository;

    @Value("${caja.horario.inicio:07:00}")
    private String horaInicioConfig;

    @Value("${caja.horario.fin:14:00}")
    private String horaFinConfig;

    public Optional<TurnoCaja> obtenerTurnoActivo() {
        return turnoCajaRepository.findByActivoTrue();
    }

    public Double obtenerMontoAperturaSugerido() {
        List<TurnoCaja> cerrados = turnoCajaRepository.findTurnosCerradosOrdenados();
        if (cerrados.isEmpty()) return 200.0;
        Double montoCierre = cerrados.get(0).getMontoCierre();
        return montoCierre != null ? montoCierre : 200.0;
    }

    public boolean esHorarioPermitido(LocalTime horaActual) {
        LocalTime inicio = LocalTime.parse(horaInicioConfig);
        LocalTime fin = LocalTime.parse(horaFinConfig);
        return !horaActual.isBefore(inicio) && !horaActual.isAfter(fin);
    }

    @Transactional
    public TurnoCaja abrirTurno(AperturaCajaRequest request, String rolUsuario) {
        if (obtenerTurnoActivo().isPresent()) {
            throw new IllegalStateException("Ya existe un turno de caja abierto. Debe cerrarlo antes de iniciar otro.");
        }

        LocalTime horaActual = LocalTime.now();
        boolean dentroDeHorario = esHorarioPermitido(horaActual);

        if (!dentroDeHorario) {
            boolean esAdmin = "ADMIN".equalsIgnoreCase(rolUsuario) || "SUPER_ADMIN".equalsIgnoreCase(rolUsuario);
            if (!esAdmin) {
                throw new IllegalStateException("Horario no permitido. El turno regular de caja es de " 
                        + horaInicioConfig + " a " + horaFinConfig + ".");
            }
            if (Boolean.FALSE.equals(request.getAperturaForzada())) {
                throw new IllegalStateException("REQUIERE_CONFIRMACION_FORZADA: La hora actual (" 
                        + horaActual.toString().substring(0, 5) 
                        + ") está fuera del turno regular. ¿Desea realizar una apertura forzada?");
            }
        }

        Double montoInicial = (request.getMontoApertura() != null && request.getMontoApertura() >= 0) 
                ? request.getMontoApertura() 
                : obtenerMontoAperturaSugerido();

        TurnoCaja turno = new TurnoCaja();
        turno.setMontoApertura(montoInicial);
        turno.setFechaApertura(LocalDateTime.now());
        turno.setActivo(true);
        turno.setTipoTurno("MAÑANA");

        turnoCajaRepository.save(turno);

        String serieApertura = turnoSequenceService.generarSiguienteTurno();
        
        // 🟢 Mapeo corregido pasando MetodoPago.EFECTIVO
        cajaMovimientoService.registrarMovimientoInterno(
                turno, 
                TipoMovimientoCaja.APERTURA, 
                "Fondo inicial", 
                montoInicial, 
                serieApertura,
                MetodoPago.EFECTIVO
        );

        return turno;
    }

    /**
     * Cálculo unificado de totales contables y arqueo de caja
     */
    public Map<String, Object> calcularMetricas(TurnoCaja turnoActivo) {
        List<MovimientoCaja> movimientos = movimientoCajaRepository.findByTurnoIdOrderByFechaAsc(turnoActivo.getId());

        double ventasEfectivo = 0.0;
        double ventasYape = 0.0;
        double ventasPlin = 0.0;
        double ventasTarjeta = 0.0;
        double totalVentas = 0.0;
        double ingresosManuales = 0.0;
        double egresosManuales = 0.0;

        for (MovimientoCaja m : movimientos) {
            double monto = m.getMonto() != null ? Math.abs(m.getMonto()) : 0.0;

            if (m.getTipo() == TipoMovimientoCaja.INGRESO_VENTA) {
                totalVentas += monto;
                MetodoPago metodo = m.getMetodoPago() != null ? m.getMetodoPago() : MetodoPago.EFECTIVO;
                
                switch (metodo) {
                    case EFECTIVO -> ventasEfectivo += monto;
                    case YAPE -> ventasYape += monto;
                    case PLIN -> ventasPlin += monto;
                    case TARJETA -> ventasTarjeta += monto;
                }
            } else if (m.getTipo() == TipoMovimientoCaja.INGRESO_MANUAL) {
                ingresosManuales += monto;
            } else if (m.getTipo() == TipoMovimientoCaja.EGRESO_MANUAL) {
                egresosManuales += monto;
            }
        }

        double efectivoEsperadoGaveta = turnoActivo.getMontoApertura() + ventasEfectivo + ingresosManuales - egresosManuales;
        double saldoTeoricoGlobal = turnoActivo.getMontoApertura() + totalVentas + ingresosManuales - egresosManuales;

        Map<String, Object> metricas = new HashMap<>();
        metricas.put("montoApertura", turnoActivo.getMontoApertura());
        metricas.put("totalVentas", totalVentas);
        metricas.put("ventasEfectivo", ventasEfectivo);
        metricas.put("ventasYape", ventasYape);
        metricas.put("ventasPlin", ventasPlin);
        metricas.put("ventasTarjeta", ventasTarjeta);
        metricas.put("ingresosManuales", ingresosManuales);
        metricas.put("egresosManuales", egresosManuales);
        metricas.put("efectivoEsperadoGaveta", Math.max(0.0, efectivoEsperadoGaveta));
        metricas.put("saldoTeoricoGlobal", Math.max(0.0, saldoTeoricoGlobal));
        metricas.put("movimientos", movimientos);

        return metricas;
    }

    @Transactional
    public TurnoCaja cerrarTurno(CierreCajaRequest request, String rolUsuario, String turnoEmpleado) {
        TurnoCaja turno = obtenerTurnoActivo()
                .orElseThrow(() -> new IllegalStateException("No existe ningún turno de caja activo para cerrar."));

        LocalTime horaActual = LocalTime.now();
        boolean esAdmin = "ADMIN".equalsIgnoreCase(rolUsuario) || "SUPER_ADMIN".equalsIgnoreCase(rolUsuario);

        if (!esAdmin && horaActual.isBefore(LocalTime.of(14, 0))) {
            throw new IllegalStateException("No puedes cerrar la caja antes de finalizar el turno (Hora permitida: desde las 02:00 PM).");
        }

        Map<String, Object> metricas = calcularMetricas(turno);
        double saldoTeorico = (Double) metricas.get("efectivoEsperadoGaveta");
        double montoCierre = request.getMontoCierre() != null ? request.getMontoCierre() : 0.0;
        double diferencia = montoCierre - saldoTeorico;

        String serieCierre = cierreCajaSequenceService.generarSiguienteCierreCaja();
        cajaMovimientoService.registrarMovimientoInterno(
                turno, 
                TipoMovimientoCaja.CIERRE, 
                "Cierre estricto de caja", 
                montoCierre, 
                serieCierre,
                MetodoPago.EFECTIVO
        );

        turno.setMontoCierre(montoCierre);
        turno.setTotalVendido((Double) metricas.get("totalVentas"));
        turno.setDiferencia(diferencia);
        turno.setObservaciones(request.getObservaciones());
        turno.setFechaCierre(LocalDateTime.now());
        turno.setActivo(false);

        return turnoCajaRepository.save(turno);
    }

    @Transactional
    public void procesarCobroComanda(Long comandaId, Map<String, Object> payload, String rolUsuario) {
        TurnoCaja turnoActivo = obtenerTurnoActivo()
                .orElseThrow(() -> new IllegalStateException("No hay un turno de caja abierto para registrar el cobro."));

        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        List<Long> idsDetalles = (List<Long>) payload.get("idsDetalles");
        
        for (DetalleComanda detalle : comanda.getDetalles()) {
            if (idsDetalles == null || idsDetalles.isEmpty() || idsDetalles.contains(detalle.getId())) {
                detalle.setPagado(true);
            }
        }

        boolean totalmentePagada = comanda.getDetalles().stream().allMatch(DetalleComanda::isPagado);

        if (totalmentePagada) {
            comanda.setEstado(EstadoComanda.ENTREGADO);
            mesaRepository.findByNumero(comanda.getNumeroMesa()).ifPresent(mesa -> {
                mesa.setEstado("DISPONIBLE");
                mesaRepository.save(mesa);
            });
        }

        comandaRepository.save(comanda);

        Double montoTotalCobrado = payload.get("montoTotal") != null 
                ? Double.parseDouble(payload.get("montoTotal").toString()) 
                : comanda.getMontoTotal();

        MetodoPago metodoEnum = MetodoPago.EFECTIVO;
        if (payload.get("metodoPago") != null) {
            try {
                metodoEnum = MetodoPago.valueOf(payload.get("metodoPago").toString().toUpperCase().trim());
            } catch (Exception ignored) {}
        }

        String concepto = "Venta Salón Mesa #" + comanda.getNumeroMesa();
        
        cajaMovimientoService.registrarMovimientoInterno(
                turnoActivo, 
                TipoMovimientoCaja.INGRESO_VENTA, 
                concepto, 
                Math.abs(montoTotalCobrado), 
                "TICKET-" + comanda.getId(),
                metodoEnum
        );
    }
}