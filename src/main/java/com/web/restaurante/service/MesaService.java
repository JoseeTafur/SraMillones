package com.web.restaurante.service;

import com.web.restaurante.dto.mesas.MesaDTO;
import com.web.restaurante.dto.mesas.TicketDTO;
import com.web.restaurante.mapper.MesaMapper;
import com.web.restaurante.model.*;
import com.web.restaurante.model.caja.TurnoCaja;
import com.web.restaurante.model.enums.EstadoComanda;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.model.enums.TipoPedido;
import com.web.restaurante.repository.ComandaRepository;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.PedidoRepository;
import com.web.restaurante.repository.VentaRepository;
import com.web.restaurante.service.caja.CajaMovimientoService;
import com.web.restaurante.service.caja.TurnoCoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MesaService {

    private final NotaVentaSequenceService notaVentaSequenceService;
    private final MesaRepository mesaRepository;
    private final PedidoRepository pedidoRepository;
    private final ComandaRepository comandaRepository;
    private final MesaMapper mesaMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final VentaRepository ventaRepository;
    private final TurnoCoreService turnoCoreService;
    private final CajaMovimientoService cajaMovimientoService;
    private final AuditoriaService auditoriaService;
    private final NotificacionService notificacionService;

    public List<MesaDTO> obtenerMesasParaSalon() {
        List<Mesa> mesasEntidad = mesaRepository.findAll();

        return mesasEntidad.stream().map(mesa -> {
            MesaDTO dto = mesaMapper.toDTO(mesa);
            if (mesa.getMesaPadre() != null) dto.setIdMesaPadre(mesa.getMesaPadre().getId());
            if (mesa.getMesasHijas() != null && !mesa.getMesasHijas().isEmpty()) {
                dto.setNumerosMesasHijas(mesa.getMesasHijas().stream().map(Mesa::getNumero).toList());
            }
            dto.setEnReserva(mesa.isEnReserva());
            return dto;
        }).toList();
    }

    public List<Comanda> obtenerPedidosActivos() {
        return comandaRepository.findAll().stream()
                .filter(c -> c.getNumeroMesa() != null)
                .filter(c -> c.getEstado() == EstadoComanda.EN_COCINA || c.getEstado() == EstadoComanda.PREPARADO || c.getEstado() == EstadoComanda.ENTREGADO)
                .toList();
    }

    @Transactional
    public void entregarPlatoEnMesa(Integer idMesa) {
        Comanda comanda = comandaRepository.findByNumeroMesa(idMesa)
                .orElseThrow(() -> new RuntimeException("No se encontró comanda activa para la mesa N° " + idMesa));

        if (comanda.getDetalles() != null) {
            for (DetalleComanda d : comanda.getDetalles()) {
                if (d.isCocinado()) {
                    d.setEntregado(true);
                }
            }
        }

        boolean todosEntregados = comanda.getDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .allMatch(DetalleComanda::isEntregado);

        if (todosEntregados) {
            comanda.setEstado(EstadoComanda.ENTREGADO);
        }

        comandaRepository.save(comanda);

        mesaRepository.findByNumero(idMesa).ifPresent(this::recalcularYNotificarEstadoCocinaMesa);
    }

    @Transactional
    public void entregarPlatoIndividual(Long comandaId, Long detalleId) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        DetalleComanda detalleTarget = comanda.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado en la comanda con ID: " + detalleId));

        detalleTarget.setEntregado(true);

        boolean todosEntregados = comanda.getDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .allMatch(DetalleComanda::isEntregado);

        if (todosEntregados) {
            comanda.setEstado(EstadoComanda.ENTREGADO);
        }

        comandaRepository.save(comanda);

        if (comanda.getNumeroMesa() != null) {
            mesaRepository.findByNumero(comanda.getNumeroMesa())
                    .ifPresent(this::recalcularYNotificarEstadoCocinaMesa);
        }
    }

    @Transactional
    public void liberarYFacturarMesa(Long idMesa) {
        Mesa mesaClickeada = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        Mesa mesaPrincipal = (mesaClickeada.getMesaPadre() != null) ? mesaClickeada.getMesaPadre() : mesaClickeada;

        List<Pedido> pedidosActivos = pedidoRepository.findByNumeroMesa(mesaPrincipal.getNumero()).stream()
                .filter(p -> !p.isEsNotaVenta())
                .filter(p -> p.getEstadoPago() != com.web.restaurante.model.enums.EstadoPago.PAGADO
                        && p.getEstado() != com.web.restaurante.model.enums.EstadoPedido.CANCELADO)
                .toList();

        for (Pedido p : pedidosActivos) {
            p.setEstadoPago(com.web.restaurante.model.enums.EstadoPago.PAGADO);

            if (p.getListaDetalles().stream().filter(d -> !d.isCanceladoPorCliente()).allMatch(DetallePedido::isEntregado)
                    || p.getEstado() == com.web.restaurante.model.enums.EstadoPedido.ENTREGADO) {
                p.setNumeroMesa(null);
                p.setFechaEntrega(LocalDateTime.now());
            }
            pedidoRepository.save(p);
        }

        mesaPrincipal.setEstado("DISPONIBLE");
        mesaRepository.save(mesaPrincipal);

        if (mesaPrincipal.getMesasHijas() != null && !mesaPrincipal.getMesasHijas().isEmpty()) {
            for (Mesa hija : mesaPrincipal.getMesasHijas()) {
                hija.setMesaPadre(null);
                hija.setEstado("DISPONIBLE");
                mesaRepository.save(hija);
            }
            mesaPrincipal.getMesasHijas().clear();
            mesaRepository.save(mesaPrincipal);
        }

        auditoriaService.registrar(
                "MESAS",
                "LIBERAR_Y_FACTURAR",
                "Mesa",
                mesaPrincipal.getId(),
                "Liberación y facturación de Mesa N° " + mesaPrincipal.getNumero() + " (" + pedidosActivos.size() + " pedido(s) cerrado(s)).",
                "Mesa #" + mesaPrincipal.getNumero() + " con pedidos activos",
                "Mesa #" + mesaPrincipal.getNumero() + " -> DISPONIBLE"
        );
    }

    @Transactional
    public void liberarMesaManual(Integer numeroMesa) {
        comandaRepository.findByNumeroMesa(numeroMesa).ifPresent(comandaRepository::delete);

        List<Pedido> pedidos = pedidoRepository.findByNumeroMesa(numeroMesa).stream()
                .filter(p -> p.getEstado() != EstadoPedido.CANCELADO && !p.isEsNotaVenta())
                .toList();

        for (Pedido pedidoActivo : pedidos) {
            pedidoActivo.setEstadoPago(com.web.restaurante.model.enums.EstadoPago.PAGADO);
            pedidoActivo.setEsNotaVenta(true);
            pedidoRepository.save(pedidoActivo);
        }

        mesaRepository.findByNumero(numeroMesa).ifPresent(mesa -> {
            Mesa mesaPrincipal = (mesa.getMesaPadre() != null) ? mesa.getMesaPadre() : mesa;
            mesaPrincipal.setEstado("DISPONIBLE");
            mesaRepository.save(mesaPrincipal);
            emitirCambioEstadoReactivo(mesaPrincipal.getNumero(), "disponible", null, "NINGUNO");
        });

        auditoriaService.registrar(
                "MESAS",
                "LIBERACION_MANUAL",
                "Mesa",
                null,
                "Liberación manual de la Mesa N° " + numeroMesa + " (se eliminó comanda activa y cerraron pedidos).",
                "Mesa #" + numeroMesa + " con comanda/pedidos activos",
                "Mesa #" + numeroMesa + " -> DISPONIBLE"
        );

        System.out.println("[La Jama] Mesa N° " + numeroMesa + " liberada manualmente.");
    }

    public Map<String, Object> generarPrecuenta(Integer numeroMesa) {
        Integer numeroMesaEfectivo = numeroMesa;
        java.util.Optional<Mesa> mesaOpt = mesaRepository.findByNumero(numeroMesa);
        if (mesaOpt.isPresent() && mesaOpt.get().getMesaPadre() != null) {
            numeroMesaEfectivo = mesaOpt.get().getMesaPadre().getNumero();
        }

        List<Pedido> pedidos = pedidoRepository.findByNumeroMesa(numeroMesaEfectivo).stream()
                .filter(p -> p.getEstado() != com.web.restaurante.model.enums.EstadoPedido.CANCELADO
                        && !p.isEsNotaVenta()
                        && (p.getComprobanteNotaNumero() == null || p.getEstadoPago() != com.web.restaurante.model.enums.EstadoPago.PAGADO))
                .toList();

        if (pedidos.isEmpty()) return null;
        Pedido pedidoActivo = pedidos.get(pedidos.size() - 1);

        List<DetallePedido> detallesPrecuenta = pedidoActivo.getListaDetalles().stream()
                .filter(d -> {
                    if (d.isCanceladoPorCliente()) {
                        return !d.isPagado();
                    }
                    return !(d.isPagado() && d.isEntregado());
                })
                .toList();

        double totalDeudaRestante = pedidoActivo.getListaDetalles().stream()
                .filter(d -> !d.isPagado())
                .mapToDouble(d -> d.getSubtotal() != null ? d.getSubtotal() : 0.0)
                .sum();

        double consumoTotalHistorico = pedidoActivo.getListaDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .mapToDouble(d -> d.getSubtotal() != null ? d.getSubtotal() : 0.0)
                .sum();

        boolean tienePlatosActivosRestantes = pedidoActivo.getListaDetalles().stream()
                .anyMatch(d -> {
                    if (d.isCanceladoPorCliente()) {
                        return !d.isPagado();
                    }
                    return !(d.isPagado() && d.isEntregado());
                });

        boolean mesaListaParaLiberar = false;

        if (!tienePlatosActivosRestantes) {
            mesaListaParaLiberar = true;
            pedidoActivo.setEstadoPago(com.web.restaurante.model.enums.EstadoPago.PAGADO);
            pedidoActivo.setEstado(com.web.restaurante.model.enums.EstadoPedido.ENTREGADO);
            pedidoActivo.setFechaEntrega(LocalDateTime.now());
            pedidoActivo.setEsNotaVenta(true);
        }

        pedidoActivo.setMontoTotal(consumoTotalHistorico);
        pedidoRepository.saveAndFlush(pedidoActivo);

        if (!tienePlatosActivosRestantes) {
            mesaRepository.findByNumero(numeroMesaEfectivo).ifPresent(mesa -> {
                Mesa mesaPrincipal = (mesa.getMesaPadre() != null) ? mesa.getMesaPadre() : mesa;
                mesaPrincipal.setEstado("DISPONIBLE");
                mesaRepository.save(mesaPrincipal);
                emitirCambioEstadoReactivo(mesaPrincipal.getNumero(), "disponible", null, "NINGUNO");
            });
        }

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("idPedido", pedidoActivo.getId());
        respuesta.put("mesaListaParaLiberar", mesaListaParaLiberar);
        respuesta.put("montoTotal", totalDeudaRestante == 0 ? consumoTotalHistorico : totalDeudaRestante);
        respuesta.put("detalles", detallesPrecuenta);
        return respuesta;
    }

    @Transactional
    public void procesarCobro(Long comandaId, Long mesaId, List<Long> idsDetallesPagados, MetodoPago metodoPago, String nombreCliente) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda activa no encontrada con ID: " + comandaId));

        List<DetalleComanda> detallesACobrar = comanda.getDetalles().stream()
                .filter(d -> idsDetallesPagados.contains(d.getId()))
                .toList();

        if (!detallesACobrar.isEmpty()) {
            detallesACobrar.forEach(d -> d.setPagado(true));

            String clienteFinal = (nombreCliente != null && !nombreCliente.trim().isEmpty())
                    ? nombreCliente.trim().toUpperCase()
                    : "CLIENTE MESA #" + comanda.getNumeroMesa();

            Venta venta = new Venta();
            venta.setNumeroComprobante(notaVentaSequenceService.generarSiguienteNota());
            venta.setTipoComprobante("NOTA_VENTA");
            venta.setClienteNombre(clienteFinal);
            venta.setNumeroMesa(comanda.getNumeroMesa());
            venta.setTipoAtencion(TipoPedido.SALON);
            venta.setEstadoPago(EstadoPago.PAGADO);
            venta.setMetodoPago(metodoPago != null ? metodoPago : MetodoPago.EFECTIVO);

            double montoTotal = 0.0;

            for (DetalleComanda dc : detallesACobrar) {
                DetalleVenta dv = new DetalleVenta();
                dv.setVenta(venta);
                dv.setProducto(dc.getProducto());
                dv.setNombreProducto(dc.getProducto() != null ? dc.getProducto().getNombre() : "Plato");
                dv.setCantidad(dc.getCantidad());
                dv.setPrecioUnitario(dc.getPrecioUnitario());
                dv.setSubtotal(dc.getPrecioUnitario() * dc.getCantidad());

                venta.getDetalles().add(dv);
                montoTotal += dv.getSubtotal();
            }

            venta.setMontoTotal(montoTotal);
            turnoCoreService.obtenerTurnoActivo().ifPresent(venta::setTurnoCaja);

            ventaRepository.save(venta);

            String concepto = venta.getClienteNombre() + " (Mesa #" + comanda.getNumeroMesa() + ")";

            cajaMovimientoService.registrarVentaAutomatica(
                    concepto,
                    montoTotal,
                    venta.getMetodoPago(),
                    venta.getNumeroComprobante()
            );

            auditoriaService.registrar(
                    "VENTAS",
                    "COBRO_MESA",
                    "Venta",
                    venta.getId(),
                    "Cobro en Mesa #" + comanda.getNumeroMesa() + " - " + venta.getNumeroComprobante() + " por S/ " + String.format("%.2f", montoTotal),
                    "Detalles pendientes de pago: " + detallesACobrar.size() + " ítem(s)",
                    "Comprobante: " + venta.getNumeroComprobante() + " | Cliente: " + clienteFinal + " | Método: " + venta.getMetodoPago() + " | Total: S/ " + String.format("%.2f", montoTotal)
            );
        }

        comanda.getDetalles().removeIf(d -> d.isEntregado() && d.isPagado());

        Mesa mesaPrincipal = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        if (mesaPrincipal.getMesaPadre() != null) {
            mesaPrincipal = mesaPrincipal.getMesaPadre();
        }

        if (comanda.getDetalles().isEmpty()) {
            comandaRepository.delete(comanda);

            mesaPrincipal.setEstado("DISPONIBLE");
            if (mesaPrincipal.getMesasHijas() != null && !mesaPrincipal.getMesasHijas().isEmpty()) {
                for (Mesa hija : mesaPrincipal.getMesasHijas()) {
                    hija.setMesaPadre(null);
                    hija.setEstado("DISPONIBLE");
                    mesaRepository.save(hija);
                }
                mesaPrincipal.getMesasHijas().clear();
            }
            mesaRepository.save(mesaPrincipal);
            emitirCambioEstadoReactivo(mesaPrincipal.getNumero(), "disponible", null, "NINGUNO");
        } else {
            comandaRepository.save(comanda);
            recalcularYNotificarEstadoCocinaMesa(mesaPrincipal);
        }
    }

    @Transactional
    public void procesarCobro(Long comandaId, Long mesaId, List<Long> idsDetallesPagados, MetodoPago metodoPago) {
        procesarCobro(comandaId, mesaId, idsDetallesPagados, metodoPago, null);
    }

    @Transactional
    public void desvincularMesa(Long idMesa) {
        Mesa mesa = mesaRepository.findById(idMesa).orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        String estadoAnterior = mesa.getEstado();
        mesa.setMesaPadre(null);
        mesa.setEstado("DISPONIBLE");
        mesaRepository.save(mesa);

        auditoriaService.registrar(
                "MESAS",
                "DESVINCULAR_MESA",
                "Mesa",
                mesa.getId(),
                "Mesa #" + mesa.getNumero() + " desvinculada de su grupo y liberada.",
                "Estado anterior: " + estadoAnterior,
                "Estado nuevo: DISPONIBLE"
        );
    }

    @Transactional
    public void desagruparGrupoCompleto(Long idMesaPadre) {
        Mesa padre = mesaRepository.findById(idMesaPadre)
                .orElseThrow(() -> new RuntimeException("Mesa principal no encontrada"));

        List<Pedido> pedidosActivos = pedidoRepository.findByNumeroMesa(padre.getNumero()).stream()
                .filter(p -> p.getMontoTotal() > 0 && p.getNumeroMesa() != null
                        && !p.isEsNotaVenta()
                        && p.getEstadoPago() != com.web.restaurante.model.enums.EstadoPago.PAGADO
                        && p.getEstado() != com.web.restaurante.model.enums.EstadoPedido.CANCELADO)
                .toList();

        if (padre.getMesasHijas() != null && !padre.getMesasHijas().isEmpty()) {
            for (Mesa hija : padre.getMesasHijas()) {
                hija.setMesaPadre(null);
                hija.setEstado("DISPONIBLE");
                mesaRepository.save(hija);
                emitirCambioEstadoReactivo(hija.getNumero(), "disponible", null, "NINGUNO");
            }
            padre.getMesasHijas().clear();
            mesaRepository.saveAndFlush(padre);
        }

        if (!pedidosActivos.isEmpty()) {
            padre.setEstado("OCUPADA");
            mesaRepository.save(padre);
            recalcularYNotificarEstadoCocinaMesa(padre);
        } else {
            padre.setEstado("DISPONIBLE");
            mesaRepository.save(padre);
            emitirCambioEstadoReactivo(padre.getNumero(), "disponible", null, "NINGUNO");
        }

        auditoriaService.registrar(
                "MESAS",
                "DESAGRUPAR_MESAS",
                "Mesa",
                padre.getId(),
                "Se desagrupó todo el bloque de la Mesa principal #" + padre.getNumero(),
                "Grupo unificado activo",
                "Mesa principal #" + padre.getNumero() + " en estado " + padre.getEstado()
        );
    }

    @Transactional
    public void unificarMesas(Long idMesaPrincipal, List<Long> idsMesasHijas) {
        Mesa mesaPadre = mesaRepository.findById(idMesaPrincipal)
                .orElseThrow(() -> new RuntimeException("Mesa principal no encontrada"));

        mesaPadre.setEstado("UNIFICADA");
        mesaRepository.save(mesaPadre);

        for (Long idHija : idsMesasHijas) {
            Mesa hija = mesaRepository.findById(idHija).orElseThrow();
            hija.setMesaPadre(mesaPadre);
            hija.setEstado("UNIFICADA");
            mesaRepository.save(hija);
        }

        recalcularYNotificarEstadoCocinaMesa(mesaPadre);
        for (Long idHija : idsMesasHijas) {
            mesaRepository.findById(idHija).ifPresent(this::recalcularYNotificarEstadoCocinaMesa);
        }

        auditoriaService.registrar(
                "MESAS",
                "UNIFICAR_MESAS",
                "Mesa",
                mesaPadre.getId(),
                "Unificación de Mesa principal #" + mesaPadre.getNumero() + " con " + idsMesasHijas.size() + " mesa(s) hija(s).",
                "Mesas individuales (IDs hijas: " + idsMesasHijas + ")",
                "Mesa Padre #" + mesaPadre.getNumero() + " en estado UNIFICADA"
        );
    }

    @Transactional
    public void eliminarDetallePedido(Long pedidoId, Long detalleId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        DetallePedido detalle = pedido.getListaDetalles().stream()
                .filter(d -> d.getId().equals(detalleId) && !d.isCanceladoPorCliente())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El producto no está en la comanda o ya fue cancelado"));

        String nombrePlatoAud = detalle.getProducto() != null ? detalle.getProducto().getNombre() : "Producto #" + detalleId;
        int cantAud = detalle.getCantidad() != null ? detalle.getCantidad() : 1;
        double totalAntes = pedido.getMontoTotal() != null ? pedido.getMontoTotal() : 0.0;
        boolean yaEnCocina = detalle.isImpresoEnCocina();

        if (!yaEnCocina) {
            pedido.getListaDetalles().remove(detalle);
            double nuevoTotal = pedido.getListaDetalles().stream()
                    .filter(d -> !d.isCanceladoPorCliente())
                    .mapToDouble(d -> d.getSubtotal() != null ? d.getSubtotal() : 0.0).sum();
            pedido.setMontoTotal(nuevoTotal);
        } else {
            detalle.setCanceladoPorCliente(true);
            String nombrePlato = detalle.getProducto().getNombre().toUpperCase();
            String mesaAviso = (pedido.getNumeroMesa() != null) ? "MESA " + pedido.getNumeroMesa() : "DELIVERY";
            messagingTemplate.convertAndSend("/topic/notificaciones", "ALERTA DE MERMA: DETENER " + nombrePlato + " DE LA " + mesaAviso);
        }
        pedidoRepository.save(pedido);

        auditoriaService.registrar(
                "VENTAS",
                yaEnCocina ? "CANCELAR_PLATO_COCINA" : "ELIMINAR_PLATO_PEDIDO",
                "Pedido",
                pedido.getId(),
                (yaEnCocina ? "MERMA: Cancelado en cocina '" : "Eliminado del pedido '") + nombrePlatoAud + "' (x" + cantAud + ") en Pedido #" + pedido.getId(),
                "Total pedido antes: S/ " + String.format("%.2f", totalAntes) + " | Impreso en cocina: " + (yaEnCocina ? "SI" : "NO"),
                "Total pedido después: S/ " + String.format("%.2f", pedido.getMontoTotal())
        );
    }

    @Transactional
    public void liberarMesaForzado(Long idMesa) {
        Mesa mesaClickeada = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        Mesa mesaPrincipal = (mesaClickeada.getMesaPadre() != null) ? mesaClickeada.getMesaPadre() : mesaClickeada;
        String estadoAnterior = mesaPrincipal.getEstado();

        comandaRepository.findByNumeroMesa(mesaPrincipal.getNumero()).ifPresent(c -> {
    notificacionService.resolverPorReferencia("COMANDA", c.getId());
    comandaRepository.delete(c);
});
notificacionService.crear(
        "SISTEMA",
        "🚨 Liberación forzada ejecutada en Mesa #" + mesaPrincipal.getNumero(),
        "ADMIN",
        "/admin/auditoria",
        mesaPrincipal.getId()
);

        mesaPrincipal.setEstado("DISPONIBLE");
        mesaRepository.save(mesaPrincipal);

        if (mesaPrincipal.getMesasHijas() != null && !mesaPrincipal.getMesasHijas().isEmpty()) {
            for (Mesa hija : mesaPrincipal.getMesasHijas()) {
                hija.setMesaPadre(null);
                hija.setEstado("DISPONIBLE");
                mesaRepository.save(hija);
            }
            mesaPrincipal.getMesasHijas().clear();
            mesaRepository.save(mesaPrincipal);
        }

        auditoriaService.registrar(
                "MESAS",
                "LIBERACION_FORZADA",
                "Mesa",
                mesaPrincipal.getId(),
                "Liberación forzada de Mesa N° " + mesaPrincipal.getNumero() + " sin flujo normal de caja.",
                "Estado anterior: " + estadoAnterior,
                "Estado nuevo: DISPONIBLE (Comanda eliminada)"
        );
    }

    @Transactional
    public void trasladarComandaDeMesa(Long idMesaOrigen, Long idMesaDestino) {
        Mesa origen = mesaRepository.findById(idMesaOrigen)
                .orElseThrow(() -> new RuntimeException("Mesa origen no encontrada"));
        Mesa destino = mesaRepository.findById(idMesaDestino)
                .orElseThrow(() -> new RuntimeException("Mesa destino no encontrada"));

        comandaRepository.findByNumeroMesa(origen.getNumero()).ifPresent(c -> {
            c.setNumeroMesa(destino.getNumero());
            comandaRepository.save(c);
        });

        origen.setEstado("DISPONIBLE");
        destino.setEstado("OCUPADA");

        mesaRepository.save(origen);
        mesaRepository.save(destino);

        recalcularYNotificarEstadoCocinaMesa(origen);
        recalcularYNotificarEstadoCocinaMesa(destino);

        auditoriaService.registrar(
                "MESAS",
                "TRASLADO_MESA",
                "Mesa",
                destino.getId(),
                "Traslado de comanda de Mesa #" + origen.getNumero() + " hacia Mesa #" + destino.getNumero(),
                "Mesa origen #" + origen.getNumero() + " (OCUPADA) -> Mesa destino #" + destino.getNumero() + " (DISPONIBLE)",
                "Mesa origen #" + origen.getNumero() + " (DISPONIBLE) -> Mesa destino #" + destino.getNumero() + " (OCUPADA)"
        );
    }

    @Transactional
    public void procesarLiquidacionMultiticket(Long pedidoId, Long mesaId, List<TicketDTO> tickets, List<Long> idsDetallesPagados) {
        Pedido pedidoPadre = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido original N° " + pedidoId + " no encontrado"));

        Mesa mesaFisica = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada con ID: " + mesaId));

        Mesa mesaPrincipal = (mesaFisica.getMesaPadre() != null) ? mesaFisica.getMesaPadre() : mesaFisica;
        final Integer numeroMesaFijoEInmutable = mesaPrincipal.getNumero();

        List<DetallePedido> detallesOriginalesGuardados = new ArrayList<>(pedidoPadre.getListaDetalles());

        double montoFinalFijoEInmutable = 0.0;
        if (idsDetallesPagados != null && !idsDetallesPagados.isEmpty()) {
            montoFinalFijoEInmutable = detallesOriginalesGuardados.stream()
                    .filter(d -> idsDetallesPagados.contains(d.getId()))
                    .mapToDouble(d -> d.getSubtotal() != null ? d.getSubtotal() : (d.getPrecioUnitario() != null ? d.getPrecioUnitario() * d.getCantidad() : 0.0))
                    .sum();
        }

        double totalLiquidadoAud = 0.0;

        for (TicketDTO t : tickets) {
            Pedido pedidoComprobante = new Pedido();
            String siguienteNotaVenta = notaVentaSequenceService.generarSiguienteNota();
            pedidoComprobante.setComprobanteNotaNumero(siguienteNotaVenta);

            pedidoComprobante.setCliente(t.getNombreCliente() != null && !t.getNombreCliente().trim().isEmpty()
                    ? t.getNombreCliente().trim().toUpperCase()
                    : ("MESA " + numeroMesaFijoEInmutable + " (TICKET)").toUpperCase());

            pedidoComprobante.setDireccion("");
            pedidoComprobante.setNumeroMesa(numeroMesaFijoEInmutable);
            pedidoComprobante.setFechaCreacion(LocalDateTime.now());
            pedidoComprobante.setFechaEntrega(LocalDateTime.now());
            pedidoComprobante.setTipoPedido(TipoPedido.SALON);
            pedidoComprobante.setEstado(EstadoPedido.ENTREGADO);
            pedidoComprobante.setEstadoPago(EstadoPago.PAGADO);
            pedidoComprobante.setEsNotaVenta(true);
            pedidoComprobante.setPreferenciaComprobante(t.getTipoDoc() != null ? t.getTipoDoc().toUpperCase() : "BOLETA");
            pedidoComprobante.setDocumentoCliente(t.getNumDoc() != null ? t.getNumDoc().trim() : "SIN DOCUMENTO");

            double montoDeEsteTicket = t.getConsumoFinal() > 0 ? t.getConsumoFinal() : montoFinalFijoEInmutable;
            pedidoComprobante.setMontoTotal(montoDeEsteTicket);
            totalLiquidadoAud += montoDeEsteTicket;

            turnoCoreService.obtenerTurnoActivo().ifPresent(pedidoComprobante::setTurnoCaja);
            pedidoRepository.saveAndFlush(pedidoComprobante);

            String conceptoCaja = "Liquidación Ticket (Mesa " + numeroMesaFijoEInmutable + ") - Nota: " + pedidoComprobante.getComprobanteNotaNumero();
            cajaMovimientoService.registrarVentaAutomatica(conceptoCaja, montoDeEsteTicket, MetodoPago.EFECTIVO, pedidoComprobante.getComprobanteNotaNumero());
        }

        comandaRepository.findByNumeroMesa(numeroMesaFijoEInmutable).ifPresent(comandaRepository::delete);

        mesaPrincipal.setEstado("DISPONIBLE");
        mesaRepository.save(mesaPrincipal);
        emitirCambioEstadoReactivo(mesaPrincipal.getNumero(), "disponible", null, "NINGUNO");

        auditoriaService.registrar(
                "VENTAS",
                "LIQUIDACION_MULTITICKET",
                "Pedido",
                pedidoPadre.getId(),
                "Liquidación multiticket en Mesa #" + numeroMesaFijoEInmutable + " (" + tickets.size() + " tickets emitidos).",
                "Pedido #" + pedidoPadre.getId() + " activo en mesa",
                "Mesa #" + numeroMesaFijoEInmutable + " -> DISPONIBLE | Total liquidado: S/ " + String.format("%.2f", totalLiquidadoAud)
        );
    }

    public void recalcularYNotificarEstadoCocinaMesa(Mesa mesa) {
        List<Comanda> comandasActivas = comandaRepository.findByNumeroMesa(mesa.getNumero()).stream()
                .filter(c -> c.getEstado() == EstadoComanda.EN_COCINA || c.getEstado() == EstadoComanda.PREPARADO)
                .toList();

        if (comandasActivas.isEmpty()) {
            mesa.setEstado("DISPONIBLE");
            mesaRepository.save(mesa);
            emitirCambioEstadoReactivo(mesa.getNumero(), "disponible", null, "NINGUNO");
            return;
        }

        Comanda comandaPrincipal = comandasActivas.get(0);
        List<DetalleComanda> platos = comandaPrincipal.getDetalles() != null ? comandaPrincipal.getDetalles() : new ArrayList<>();

        boolean tienePlatosPorEntregar = platos.stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && d.isCocinado() && !d.isEntregado());

        String estadoMesaDestino = "ocupada";
        if (tienePlatosPorEntregar) {
            estadoMesaDestino = "lista-para-recoger";
        }

        mesa.setEstado(estadoMesaDestino.toUpperCase().replace("-", "_"));
        mesaRepository.save(mesa);
        emitirCambioEstadoReactivo(mesa.getNumero(), estadoMesaDestino, comandaPrincipal.getId(), comandaPrincipal.getEstado().name());
    }

    private void emitirCambioEstadoReactivo(Integer numeroMesa, String estado, Long pedidoId, String pedidoEstado) {
        try {
            String jsonEvent = String.format(
                    "{\"numeroMesa\": %d, \"nuevoEstado\": \"%s\", \"pedidoId\": %s, \"pedidoEstado\": \"%s\"}",
                    numeroMesa, estado, (pedidoId != null ? pedidoId : "null"), pedidoEstado
            );
            messagingTemplate.convertAndSend("/topic/mesas/estados", jsonEvent);
        } catch (Exception e) {
            System.err.println("Canal WebSocket ocupado temporalmente.");
        }
    }

    @Transactional
    public void mudarMesasAReservaEnBloque(List<Long> idsMesas) {
        List<Mesa> mesasTarget = mesaRepository.findAllById(idsMesas);
        for (Mesa m : mesasTarget) {
            m.setEnReserva(true);
            m.setEstado("DISPONIBLE");
            mesaRepository.save(m);
            emitirCambioEstadoReactivo(m.getNumero(), "reservada", null, "NINGUNO");
        }
        mesaRepository.flush();

        String numsReserva = mesasTarget.stream().map(m -> "#" + m.getNumero()).toList().toString();
        auditoriaService.registrar(
                "MESAS",
                "RESERVAR_BLOQUE",
                "Mesa",
                null,
                "Mesas marcadas en reserva: " + numsReserva,
                "enReserva: false",
                "enReserva: true (" + numsReserva + ")"
        );
    }

    @Transactional
    public void liberarMesasDeReservaEnBloque(List<Long> idsMesas) {
        List<Mesa> mesasTarget = mesaRepository.findAllById(idsMesas);
        for (Mesa m : mesasTarget) {
            m.setEnReserva(false);
            m.setEstado("DISPONIBLE");
            mesaRepository.save(m);
            emitirCambioEstadoReactivo(m.getNumero(), "disponible", null, "NINGUNO");
        }
        mesaRepository.flush();

        String numsLiberadas = mesasTarget.stream().map(m -> "#" + m.getNumero()).toList().toString();
        auditoriaService.registrar(
                "MESAS",
                "LIBERAR_RESERVA_BLOQUE",
                "Mesa",
                null,
                "Mesas liberadas de reserva: " + numsLiberadas,
                "enReserva: true",
                "enReserva: false (" + numsLiberadas + ")"
        );
    }

    @Transactional
    public void procesarCobroMultiTicket(Long comandaId, Long mesaId, List<Long> idsDetallesPagados, List<Map<String, Object>> ticketsData) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda activa no encontrada con ID: " + comandaId));

        List<DetalleComanda> detallesACobrar = comanda.getDetalles().stream()
                .filter(d -> idsDetallesPagados.contains(d.getId()))
                .toList();

        if (!detallesACobrar.isEmpty()) {
            detallesACobrar.forEach(d -> d.setPagado(true));

            TurnoCaja turnoActivo = turnoCoreService.obtenerTurnoActivo().orElse(null);

            if (ticketsData != null && !ticketsData.isEmpty()) {
                for (Map<String, Object> ticketMap : ticketsData) {

                    Double montoBase = Double.valueOf(ticketMap.get("montoBase").toString());
                    Double propina = ticketMap.get("propina") != null ? Double.valueOf(ticketMap.get("propina").toString()) : 0.0;
                    Double montoFinal = montoBase + propina;

                    String metodoPagoStr = ticketMap.get("metodoPago") != null
                        ? ticketMap.get("metodoPago").toString()
                        : "EFECTIVO";
                    MetodoPago metodoPago = MetodoPago.valueOf(metodoPagoStr.toUpperCase());

                    String clienteTicket = ticketMap.get("nombreCliente") != null && !ticketMap.get("nombreCliente").toString().trim().isEmpty()
                        ? ticketMap.get("nombreCliente").toString().trim().toUpperCase()
                        : "CLIENTE MESA #" + comanda.getNumeroMesa();

                    Venta venta = new Venta();
                    venta.setNumeroComprobante(notaVentaSequenceService.generarSiguienteNota());
                    venta.setTipoComprobante("NOTA_VENTA");
                    venta.setClienteNombre(clienteTicket);
                    venta.setNumeroMesa(comanda.getNumeroMesa());
                    venta.setTipoAtencion(TipoPedido.SALON);
                    venta.setEstadoPago(EstadoPago.PAGADO);
                    venta.setMetodoPago(metodoPago);
                    venta.setMontoTotal(montoFinal);
                    venta.setTurnoCaja(turnoActivo);

                    for (DetalleComanda dc : detallesACobrar) {
                        DetalleVenta dv = new DetalleVenta();
                        dv.setVenta(venta);
                        dv.setProducto(dc.getProducto());
                        dv.setNombreProducto(dc.getProducto() != null ? dc.getProducto().getNombre() : "Plato");
                        dv.setCantidad(dc.getCantidad());
                        dv.setPrecioUnitario(dc.getPrecioUnitario());
                        dv.setSubtotal(dc.getPrecioUnitario() * dc.getCantidad());

                        venta.getDetalles().add(dv);
                    }

                    ventaRepository.save(venta);

                    String concepto = clienteTicket + " (Mesa #" + comanda.getNumeroMesa() + ")";

                    cajaMovimientoService.registrarVentaAutomatica(
                            concepto,
                            montoFinal,
                            metodoPago,
                            venta.getNumeroComprobante()
                    );

                    auditoriaService.registrar(
                            "VENTAS",
                            "COBRO_MULTITICKET",
                            "Venta",
                            venta.getId(),
                            "Cobro dividido en Mesa #" + comanda.getNumeroMesa() + " - " + venta.getNumeroComprobante() + " por S/ " + String.format("%.2f", montoFinal),
                            "Ticket individual de cuenta dividida",
                            "Comprobante: " + venta.getNumeroComprobante() + " | Cliente: " + clienteTicket + " | Método: " + metodoPago + " | Total: S/ " + String.format("%.2f", montoFinal)
                    );
                }
            }
        }

        comanda.getDetalles().removeIf(d -> d.isEntregado() && d.isPagado());

        Mesa mesaPrincipal = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        if (mesaPrincipal.getMesaPadre() != null) {
            mesaPrincipal = mesaPrincipal.getMesaPadre();
        }

        if (comanda.getDetalles().isEmpty()) {
            notificacionService.resolverPorReferencia("COMANDA", comanda.getId());
            comandaRepository.delete(comanda);

            mesaPrincipal.setEstado("DISPONIBLE");
            if (mesaPrincipal.getMesasHijas() != null && !mesaPrincipal.getMesasHijas().isEmpty()) {
                for (Mesa hija : mesaPrincipal.getMesasHijas()) {
                    hija.setMesaPadre(null);
                    hija.setEstado("DISPONIBLE");
                    mesaRepository.save(hija);
                }
                mesaPrincipal.getMesasHijas().clear();
            }
            mesaRepository.save(mesaPrincipal);
            emitirCambioEstadoReactivo(mesaPrincipal.getNumero(), "disponible", null, "NINGUNO");
        } else {
            comandaRepository.save(comanda);
            recalcularYNotificarEstadoCocinaMesa(mesaPrincipal);
        }
    }
}