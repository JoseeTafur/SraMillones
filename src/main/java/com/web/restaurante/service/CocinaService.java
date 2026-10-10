package com.web.restaurante.service;

import com.web.restaurante.model.DetallePedido;
import com.web.restaurante.model.Insumo;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.repository.InsumoProductoRepository;
import com.web.restaurante.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CocinaService {

    private final PedidoRepository pedidoRepository;
    private final InsumoProductoRepository insumoProductoRepository;
    private final ProteinaService proteinaService;
    private final InsumoService insumoService;

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidosFrios() {
        return pedidoRepository.findAll().stream()
                .filter(p -> p.getEstado() == EstadoPedido.EN_COCINA ||
                        (p.getEstado() == EstadoPedido.PENDIENTE && p.getNumeroMesa() != null))
                .filter(p -> p.getListaDetalles() != null && p.getListaDetalles().stream()
                        .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado() && d.getProducto() != null && d.getProducto().getCategoria() != null
                                && (d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRI")
                                || d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRÍ"))))
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidosCalientes() {
        return pedidoRepository.findAll().stream()
                .filter(p -> p.getEstado() == EstadoPedido.EN_COCINA ||
                        (p.getEstado() == EstadoPedido.PENDIENTE && p.getNumeroMesa() != null))
                .filter(p -> p.getListaDetalles() != null && p.getListaDetalles().stream()
                        .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado() && d.getProducto() != null && d.getProducto().getCategoria() != null
                                && d.getProducto().getCategoria().getNombre().toUpperCase().contains("CALIENTE")))
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DetallePedido> obtenerDetallesPorTipo(Long pedidoId, String tipoCocina) {
        Pedido pedido = pedidoRepository.findById(pedidoId).orElse(new Pedido());
        return pedido.getListaDetalles().stream()
                .filter(d -> {
                    String nombreCat = d.getProducto().getCategoria().getNombre().toUpperCase();
                    if ("caliente".equalsIgnoreCase(tipoCocina)) return nombreCat.contains("CALIENTE");
                    else return nombreCat.contains("FRI") || nombreCat.contains("FRÍ");
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void despacharPlatoIndividual(Long pedidoId, Long detalleId) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        if (p.getListaDetalles() == null) return;

        DetallePedido detalleTarget = p.getListaDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Fila de detalle no encontrada"));

        if (!detalleTarget.isImpresoEnCocina()) {
            throw new IllegalStateException("¡Bloqueado! No puedes despachar '"
                    + detalleTarget.getProducto().getNombre() + "' porque aún no ha sido impreso del ticket.");
        }

        if (!detalleTarget.isCocinado()) {
            detalleTarget.setCocinado(true);

            insumoProductoRepository.findByProductoId(detalleTarget.getProducto().getId()).forEach(ip -> {
                if (ip.getInsumo() != null && ip.getInsumo().getCategoria() != null) {
                    Insumo insumo = ip.getInsumo();
                    double cantidadUsada = (ip.getCantidadUsada() != null) ? ip.getCantidadUsada() : 0.0;
                    double totalTeorico = cantidadUsada * detalleTarget.getCantidad();

                    double comprometidoActual = (insumo.getStockComprometido() != null) ? insumo.getStockComprometido() : 0.0;
                    insumo.setStockComprometido(Math.max(0.0, comprometidoActual - totalTeorico));

                    if (insumo.getCategoria().toUpperCase().contains("PROTEIN")) {
                        proteinaService.registrarKardexPorVenta(insumo.getId(), detalleTarget.getCantidad(), p.getId());
                    } else {
                        String detalleVenta = "Despacho a cocina (Gasto Real): " + detalleTarget.getCantidad() + "x " + detalleTarget.getProducto().getNombre();
                        insumoService.registrarMovimientoPorId(insumo.getId(), totalTeorico, "EGRESO", detalleVenta);
                    }
                }
            });
        }

        boolean tieneFrioPendiente = p.getListaDetalles().stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado() && (d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRI")
                        || d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRÍ")));

        boolean tieneCalientePendiente = p.getListaDetalles().stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado() && d.getProducto().getCategoria().getNombre().toUpperCase().contains("CALIENTE"));

        p.setFrioListo(!tieneFrioPendiente);
        p.setCalienteListo(!tieneCalientePendiente);

        if (!tieneFrioPendiente && !tieneCalientePendiente) {
            p.setEstado(EstadoPedido.PREPARADO);
        }

        pedidoRepository.save(p);
    }

    @Transactional
    public void completarEstacion(Long pedidoId, String tipoEstacion) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (p.getListaDetalles() != null) {
            for (DetallePedido d : p.getListaDetalles()) {
                if (d.getProducto() != null && d.getProducto().getCategoria() != null) {
                    String catNombre = d.getProducto().getCategoria().getNombre().toUpperCase();

                    boolean esFriaCorrespondiente = "fria".equalsIgnoreCase(tipoEstacion) && (catNombre.contains("FRI") || catNombre.contains("FRÍ"));
                    boolean esCalienteCorrespondiente = "caliente".equalsIgnoreCase(tipoEstacion) && catNombre.contains("CALIENTE");

                    if ((esFriaCorrespondiente || esCalienteCorrespondiente) && !d.isCocinado()) {
                        d.setCocinado(true);

                        insumoProductoRepository.findByProductoId(d.getProducto().getId()).forEach(ip -> {
                            if (ip.getInsumo() != null && ip.getInsumo().getCategoria() != null) {

                                if (ip.getInsumo().getCategoria().toUpperCase().contains("PROTEIN")) {
                                    proteinaService.registrarKardexPorVenta(ip.getInsumo().getId(), d.getCantidad(), p.getId());
                                } else {
                                    double cantidadUsada = (ip.getCantidadUsada() != null) ? ip.getCantidadUsada() : 0.0;
                                    double totalTeorico = cantidadUsada * d.getCantidad();
                                    String detalleVenta = "Despacho a cocina: " + d.getCantidad() + "x " + d.getProducto().getNombre();

                                    insumoService.registrarMovimientoPorId(ip.getInsumo().getId(), totalTeorico, "EGRESO", detalleVenta);
                                }
                            }
                        });
                    }
                }
            }
        }

        if ("fria".equalsIgnoreCase(tipoEstacion)) p.setFrioListo(true);
        else if ("caliente".equalsIgnoreCase(tipoEstacion)) p.setCalienteListo(true);

        boolean tieneFrio = p.getListaDetalles().stream().anyMatch(d -> d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRI") || d.getProducto().getCategoria().getNombre().toUpperCase().contains("FRÍ"));
        boolean tieneCaliente = p.getListaDetalles().stream().anyMatch(d -> d.getProducto().getCategoria().getNombre().toUpperCase().contains("CALIENTE"));

        if ((!tieneFrio || p.isFrioListo()) && (!tieneCaliente || p.isCalienteListo())) {
            p.setEstado(EstadoPedido.PREPARADO);
        }
        pedidoRepository.save(p);
    }

    @Transactional
    public void eliminarItemComanda(Long pedidoId, Long detalleId, boolean forzarMerma) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        if (pedido.getListaDetalles() == null) return;

        DetallePedido detalleTarget = pedido.getListaDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Línea de comanda no encontrada ID: " + detalleId));

        boolean esMermaReal = forzarMerma || detalleTarget.isImpresoEnCocina();

        if (esMermaReal) {
            detalleTarget.setCanceladoPorCliente(true);
            detalleTarget.setImpresoEnCocina(true);
        } else {
            pedido.getListaDetalles().remove(detalleTarget);
            detalleTarget.setPedido(null);
        }

        if (!detalleTarget.isCocinado()) {
            insumoProductoRepository.findByProductoId(detalleTarget.getProducto().getId()).forEach(ip -> {
                if (ip.getInsumo() != null) {
                    Insumo insumo = ip.getInsumo();
                    double cantidadUsada = (ip.getCantidadUsada() != null) ? ip.getCantidadUsada() : 0.0;
                    double totalInsumo = cantidadUsada * detalleTarget.getCantidad();

                    double comprometidoActual = (insumo.getStockComprometido() != null) ? insumo.getStockComprometido() : 0.0;
                    insumo.setStockComprometido(Math.max(0.0, comprometidoActual - totalInsumo));

                    if (esMermaReal && insumo.getCategoria() != null && insumo.getCategoria().toUpperCase().contains("PROTEIN")) {
                        proteinaService.registrarKardexPorVenta(insumo.getId(), detalleTarget.getCantidad(), pedido.getId());
                    }
                }
            });
            detalleTarget.setCocinado(true);
        }

        recalcularTotalesPedido(pedido);

        boolean tienePlatosActivosPendientes = pedido.getListaDetalles().stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado());

        if (!tienePlatosActivosPendientes) {
            pedido.setFrioListo(true);
            pedido.setCalienteListo(true);
            pedido.setEstado(EstadoPedido.PREPARADO);
        }

        pedidoRepository.save(pedido);
    }

    private void recalcularTotalesPedido(Pedido pedido) {
        double nuevoTotal = pedido.getListaDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente() || (d.isCanceladoPorCliente() && !d.isPagado()))
                .mapToDouble(d -> d.getPrecioUnitario() * d.getCantidad())
                .sum();
        pedido.setMontoTotal(nuevoTotal);
    }
}