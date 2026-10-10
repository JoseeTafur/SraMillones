package com.web.restaurante.service;

import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.TurnoCaja;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CajaOperativaService {

    private final PedidoRepository pedidoRepository;
    private final TurnoCajaService turnoCajaService;
    private final NotaVentaSequenceService notaVentaSequenceService;

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidosPorCobrar() {
        return pedidoRepository.listarPedidosPorCobrar();
    }

    @Transactional
    public void cobrarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el pedido con ID: " + id));
        pedido.setEstadoPago(EstadoPago.PAGADO);

        turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void prepararCuenta(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));

        pedido.setEstado(EstadoPedido.PREPARADO);
        turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void aprobarPedidoACocina(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        pedido.setEstado(EstadoPedido.EN_COCINA);
        pedido.setFechaEntrega(LocalDateTime.now());

        if (pedido.getComprobanteNotaNumero() == null || pedido.getComprobanteNotaNumero().isEmpty()) {
            String siguienteNota = notaVentaSequenceService.generarSiguienteNota();
            pedido.setComprobanteNotaNumero(siguienteNota);
        }

        if (pedido.getMontoTotal() != null && pedido.getMontoTotal() > 0) {
            String conceptoVenta = "Carta QR (" + pedido.getMetodoPago() + ") - " + pedido.getComprobanteNotaNumero();
            turnoCajaService.registrarVenta(conceptoVenta, pedido.getMontoTotal());
        }

        pedido.setEstadoPago(EstadoPago.PAGADO);
        pedidoRepository.save(pedido);
    }

    @Transactional(readOnly = true)
    public List<Pedido> obtenerPedidosParaCajaHoy() {
        Optional<TurnoCaja> turnoOpt = turnoCajaService.obtenerTurnoActivo();
        LocalDateTime inicioRangoContable = (turnoOpt.isPresent() && turnoOpt.get().getFechaApertura() != null)
                ? turnoOpt.get().getFechaApertura()
                : LocalDate.now().atStartOfDay();
        return pedidoRepository.findPedidosParaComprobantesHoy(inicioRangoContable);
    }

    @Transactional(readOnly = true)
    public boolean existeNumeroOperationHoy(String firmaVoucher) {
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        return pedidoRepository.findAll().stream()
                .filter(p -> p.getFechaCreacion() != null && p.getFechaCreacion().isAfter(inicioHoy))
                .anyMatch(p -> firmaVoucher.equalsIgnoreCase(p.getDocumentoCliente()));
    }
}