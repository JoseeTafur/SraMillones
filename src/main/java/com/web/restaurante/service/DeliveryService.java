package com.web.restaurante.service;

import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.model.enums.TipoPedido;
import com.web.restaurante.repository.EmpleadoRepository;
import com.web.restaurante.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final PedidoRepository pedidoRepository;
    private final EmpleadoRepository empleadoRepository;

    private final double LAT_LOCAL = -6.787382;
    private final double LON_LOCAL = -79.842961;

    @Transactional(readOnly = true)
    public List<Pedido> listarPreparadosParaDespacho() {
        return pedidoRepository.findByEstado(EstadoPedido.PREPARADO)
                .stream()
                .filter(p -> p.getTipoPedido() == TipoPedido.DELIVERY)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarDeliveryPendientesConCoordenadas() {
        return pedidoRepository.findDeliveryPendientesConCoordenadas();
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidosPorRepartidor(Long idEmpleado) {
        return pedidoRepository.buscarPedidosActivosPorRepartidor(idEmpleado);
    }

    @Transactional
    public void asignarRutaARepartidor(List<Long> pedidosIds, Long empleadoId) {
        Empleado repartidor = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new IllegalArgumentException("El repartidor no existe con ID: " + empleadoId));
        for (Long id : pedidosIds) {
            Pedido p = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));
            p.setRepartidor(repartidor);
            p.setEstado(EstadoPedido.ASIGNADO);
            pedidoRepository.save(p);
        }
    }

    @Transactional
    public void asignarRepartidor(Long pedidoId, Empleado repartidor) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));
        pedido.setRepartidor(repartidor);
        pedido.setEstado(EstadoPedido.ASIGNADO);
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void iniciarRuta(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));
        pedido.setEstado(EstadoPedido.EN_CAMINO);
        pedido.setFechaSalida(LocalDateTime.now());
        pedidoRepository.save(pedido);
    }

    public List<List<Pedido>> generarSugerenciasDeRuta() {
        List<Pedido> preparados = pedidoRepository.findByEstado(EstadoPedido.PREPARADO);
        preparados.sort(Comparator.comparingDouble(p -> Math.atan2(p.getLatitud() - LAT_LOCAL, p.getLongitud() - LON_LOCAL)));
        List<List<Pedido>> grupos = new ArrayList<>();
        for (int i = 0; i < preparados.size(); i += 3) {
            List<Pedido> subLista = new ArrayList<>(preparados.subList(i, Math.min(i + 3, preparados.size())));
            grupos.add(optimizarTrayectoBurbuja(subLista));
        }
        return grupos;
    }

    public List<Pedido> optimizarTrayectoBurbuja(List<Pedido> pedidos) {
        int n = pedidos.size();
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                double distA = calcularDistancia(pedidos.get(j));
                double distB = calcularDistancia(pedidos.get(j + 1));
                if (distA > distB) {
                    Pedido temp = pedidos.get(j);
                    pedidos.set(j, pedidos.get(j + 1));
                    pedidos.set(j + 1, temp);
                }
            }
        }
        return pedidos;
    }

    private double calcularDistancia(Pedido p) {
        return Math.sqrt(Math.pow(p.getLatitud() - LAT_LOCAL, 2) + Math.pow(p.getLongitud() - LON_LOCAL, 2));
    }

    @Transactional
    public void marcarComoEntregado(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntrega(LocalDateTime.now());
        pedidoRepository.save(pedido);
    }
}