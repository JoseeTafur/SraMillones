package com.web.restaurante.service;

import com.web.restaurante.model.*;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.model.enums.TipoPedido;
import com.web.restaurante.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final TurnoCajaService turnoCajaService;
    private final MesaRepository mesaRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Pedido guardar(Pedido pedido) {
        if (pedido.getId() == null) {
            pedido.setFechaCreacion(LocalDateTime.now());
        }
        return pedidoRepository.save(pedido);
    }

    @Transactional(readOnly = true)
    public Pedido obtenerPorId(Long id) {
        return pedidoRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public Pedido requerirPedidoPorId(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró pedido con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPreparados() {
        return pedidoRepository.findByEstado(EstadoPedido.PREPARADO);
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPendientesDeCarta() {
        return pedidoRepository.findPedidosPendientesDeCarta();
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarAbsolutamenteTodoParaDebug() {
        return pedidoRepository.findAll();
    }

    @Transactional
    public void cambiarEstadoA(EstadoPedido estado, Long id) {
        Pedido pedido = requerirPedidoPorId(id);
        pedido.setEstado(estado);
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void guardarPedido(Pedido pedido) {
        if (pedido.getId() == null) {
            pedido.setEstado(EstadoPedido.EN_COCINA);
            pedido.setFechaCreacion(LocalDateTime.now());

            if (pedido.getTipoPedido() == null) {
                pedido.setTipoPedido(TipoPedido.SALON);
            }
        }

        if (pedido.getEstadoPago() == null) {
            pedido.setEstadoPago(EstadoPago.PENDIENTE);
        }

        if (pedido.getTurnoCaja() == null) {
            turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        }

        if (pedido.getListaDetalles() != null) {
            for (DetallePedido detalle : pedido.getListaDetalles()) {
                detalle.setPedido(pedido);
            }
        }
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void guardarPedido(Pedido pedidoDeFrontend, Long mesaId) {
        Pedido pedidoFinal;

        if (pedidoDeFrontend.getId() != null) {
            pedidoFinal = pedidoRepository.findById(pedidoDeFrontend.getId())
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

            pedidoFinal.setEstado(EstadoPedido.EN_COCINA);
            pedidoFinal.setEstadoPago(EstadoPago.PENDIENTE);
            pedidoFinal.setCliente(pedidoDeFrontend.getCliente());
            pedidoFinal.setDireccion(pedidoDeFrontend.getDireccion());

            if (pedidoDeFrontend.getListaDetalles() != null) {
                for (DetallePedido nuevoDetalle : pedidoDeFrontend.getListaDetalles()) {
                    Producto productoCompleto = productoRepository.findById(nuevoDetalle.getProducto().getId())
                            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

                    nuevoDetalle.setProducto(productoCompleto);
                    nuevoDetalle.setPedido(pedidoFinal);
                    nuevoDetalle.setCocinado(false);
                    pedidoFinal.getListaDetalles().add(nuevoDetalle);
                }
            }
        } else {
            pedidoFinal = pedidoDeFrontend;
            pedidoFinal.setEstado(EstadoPedido.EN_COCINA);
            pedidoFinal.setEstadoPago(EstadoPago.PENDIENTE);
            pedidoFinal.setFechaCreacion(LocalDateTime.now());

            if (pedidoFinal.getListaDetalles() != null) {
                for (DetallePedido d : pedidoFinal.getListaDetalles()) {
                    Producto productoCompleto = productoRepository.findById(d.getProducto().getId())
                            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                    d.setProducto(productoCompleto);
                    d.setCocinado(false);
                }
            }
        }

        if (pedidoFinal.getTurnoCaja() == null) {
            turnoCajaService.obtenerTurnoActivo().ifPresent(pedidoFinal::setTurnoCaja);
        }

        if (mesaId != null) {
            Mesa mesa = mesaRepository.findById(mesaId).orElseThrow();
            pedidoFinal.setNumeroMesa(mesa.getNumero());
            mesa.setEstado("OCUPADA");
            mesaRepository.save(mesa);
        }

        boolean hayFrioPendiente = false;
        boolean hayCalientePendiente = false;

        if (pedidoFinal.getListaDetalles() != null) {
            for (DetallePedido d : pedidoFinal.getListaDetalles()) {
                if (d.getProducto() != null && d.getProducto().getCategoria() != null) {
                    String cat = d.getProducto().getCategoria().getNombre().toUpperCase();
                    if ((cat.contains("FRI") || cat.contains("FRÍ")) && !d.isCocinado()) hayFrioPendiente = true;
                    if (cat.contains("CALIENTE") && !d.isCocinado()) hayCalientePendiente = true;
                }
            }
        }

        pedidoFinal.setFrioListo(!hayFrioPendiente);
        pedidoFinal.setCalienteListo(!hayCalientePendiente);

        double totalAcumulado = 0;
        if (pedidoFinal.getListaDetalles() != null) {
            for (DetallePedido detalle : pedidoFinal.getListaDetalles()) {
                detalle.setPedido(pedidoFinal);
                if (detalle.getPrecioUnitario() == null && detalle.getProducto() != null) {
                    detalle.setPrecioUnitario(detalle.getProducto().getPrecio());
                }
                totalAcumulado += detalle.getSubtotal();
            }
        }
        pedidoFinal.setMontoTotal(totalAcumulado);
        guardarPedido(pedidoFinal);
    }

    @Transactional
    public Long guardarPedidoCarta(Pedido pedido) {
        if (pedido.getId() == null) {
            pedido.setEstado(EstadoPedido.PENDIENTE);
            pedido.setFechaCreacion(LocalDateTime.now());
        }

        if (pedido.getTurnoCaja() == null) {
            turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        }

        if (pedido.getListaDetalles() != null) {
            for (DetallePedido detalle : pedido.getListaDetalles()) {
                detalle.setPedido(pedido);
                detalle.setCocinado(false);
                detalle.setEntregado(false);
                detalle.setCanceladoPorCliente(false);
            }
        }

        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setEstadoPago(EstadoPago.PENDIENTE);
        pedido.setTicketImpresoCocina(false);
        return pedidoRepository.save(pedido).getId();
    }

    @Transactional
    public void entregarPlatoIndividual(Long pedidoId, Long detalleId) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (p.getListaDetalles() == null) return;

        DetallePedido detalleTarget = p.getListaDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Plato no mapeado en comanda"));

        detalleTarget.setEntregado(true);

        boolean todosEntregados = p.getListaDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .allMatch(DetallePedido::isEntregado);

        if (todosEntregados) {
            p.setEstado(EstadoPedido.ENTREGADO);
            if (EstadoPago.PAGADO.equals(p.getEstadoPago())) {
                Integer numeroMesaRespaldo = p.getNumeroMesa();
                p.setNumeroMesa(null);
                p.setFechaEntrega(LocalDateTime.now());

                if (numeroMesaRespaldo != null) {
                    mesaRepository.findByNumero(numeroMesaRespaldo).ifPresent(mesa -> {
                        Mesa mesaPrincipal = (mesa.getMesaPadre() != null) ? mesa.getMesaPadre() : mesa;
                        mesaPrincipal.setEstado("DISPONIBLE");
                        mesaRepository.save(mesaPrincipal);
                    });
                }
            }
        }
        pedidoRepository.save(p);
    }

    @Transactional
    public void finalizarPedidoLocal(Long id, Long mesaId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntrega(LocalDateTime.now());

        if (pedido.getTurnoCaja() == null) {
            turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        }

        if (EstadoPago.PAGADO.equals(pedido.getEstadoPago())) {
            pedido.setNumeroMesa(null);
            if (mesaId != null) {
                Mesa mesa = mesaRepository.findById(mesaId).orElseThrow();
                mesa.setEstado("DISPONIBLE");
                mesaRepository.save(mesa);
            }
        }
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void marcarPedidoEnMesa(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        pedido.setFechaSalida(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.ASIGNADO);

        if (pedido.getTurnoCaja() == null) {
            turnoCajaService.obtenerTurnoActivo().ifPresent(pedido::setTurnoCaja);
        }
        pedidoRepository.save(pedido);
    }

    @Transactional(readOnly = true)
    public List<Producto> listaProductos() {
        return productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<Long, Boolean> productosAgotados(Long mesaId, String pedidoId) {
        List<Producto> listaProductos = productoRepository.findAll();
        Map<Long, Boolean> productosAgotados = new HashMap<>();

        // Sin gestión de insumos, marcamos todos los productos como disponibles (false = no agotado)
        for (Producto p : listaProductos) {
            productosAgotados.put(p.getId(), false);
        }
        return productosAgotados;
    }

    @Transactional(readOnly = true)
    public List<Pedido> obtenerPedidosPorRango(LocalDate inicio, LocalDate fin) {
        LocalDateTime desde = inicio.atStartOfDay();
        LocalDateTime hasta = fin.atTime(23, 59, 59);
        return pedidoRepository.findByFechaCreacionBetweenOrderByFechaCreacionDesc(desde, hasta);
    }

    @Transactional(readOnly = true)
    public List<Pedido> obtenerPedidosPorRangoEmision(LocalDate inicio, LocalDate fin) {
        LocalDateTime desde = inicio.atStartOfDay();
        LocalDateTime hasta = fin.atTime(23, 59, 59);

        return pedidoRepository.findAll().stream()
                .filter(p -> {
                    LocalDateTime fechaEfectiva = (p.getComprobanteNumero() != null && p.getFechaEntrega() != null)
                            ? p.getFechaEntrega()
                            : p.getFechaCreacion();
                    return fechaEfectiva != null && !fechaEfectiva.isBefore(desde) && !fechaEfectiva.isAfter(hasta);
                })
                .sorted(Comparator.comparing(Pedido::getFechaCreacion).reversed())
                .toList();
    }
}