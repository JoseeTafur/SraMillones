package com.web.restaurante.service;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.DetalleComanda;
import com.web.restaurante.model.Notificacion;
import com.web.restaurante.model.enums.EstadoComanda;
import com.web.restaurante.repository.ComandaRepository;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.NotificacionRepository;
import com.web.restaurante.service.MesaService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CocinaService {

    private final ComandaRepository comandaRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificacionRepository notificacionRepository;
    private final MesaRepository mesaRepository;
    private final MesaService mesaService;

    @Transactional(readOnly = true)
    public List<Comanda> listarPedidosActivos() {
        return comandaRepository.findAll().stream()
                .filter(c -> c.getEstado() == EstadoComanda.EN_COCINA)
                .filter(c -> c.getDetalles() != null && c.getDetalles().stream()
                        .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isEntregado()))
                .sorted(Comparator.comparing(Comanda::getFechaApertura))
                .toList();
    }

    @Transactional
    public void obtainTicket(Long comandaId) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        comanda.setTicketImpresoCocina(true);
        if (comanda.getDetalles() != null) {
            for (DetalleComanda d : comanda.getDetalles()) {
                if (!d.isCanceladoPorCliente()) {
                    d.setImpresoEnCocina(true);
                }
            }
        }
        comandaRepository.save(comanda);
    }

    @Transactional
    public void despacharItemFila(Long comandaId, Long detalleId) {
        Comanda c = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        if (c.getDetalles() == null) return;

        DetalleComanda detalleTarget = c.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Fila de detalle no encontrada en la comanda"));

        // 🍳 SOLO COCINADO: La cocina termina la preparación (cocinado = true, entregado = false)
        detalleTarget.setCocinado(true);

        // Evaluar si todos los platos ya fueron terminados de cocinar
        boolean quedanPendientesCocina = c.getDetalles().stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado());

        if (!quedanPendientesCocina) {
            c.setEstado(EstadoComanda.PREPARADO);
        }

        comandaRepository.save(c);

        // Sincronizar icono de campana (PARA_RECOGER) en el salón del mozo
        if (c.getNumeroMesa() != null) {
            mesaRepository.findByNumero(c.getNumeroMesa())
                    .ifPresent(mesaService::recalcularYNotificarEstadoCocinaMesa);
        }

        String identificadorMesa = (c.getNumeroMesa() != null) ? "Mesa N° " + c.getNumeroMesa() : "Carta/Delivery";
        String msgNotif = "🍳 ¡Listo para servir! " + detalleTarget.getProducto().getNombre() + " asignado a la " + identificadorMesa;
        registrarYEnviarNotificacion(msgNotif);
    }

    @Transactional
    public void despacharLoteEstacion(Long comandaId, String tipoEstacion) {
        Comanda c = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        if (c.getDetalles() != null) {
            for (DetalleComanda d : c.getDetalles()) {
                if (!d.isCanceladoPorCliente() && !d.isCocinado()) {
                    d.setCocinado(true);
                }
            }
        }

        c.setEstado(EstadoComanda.PREPARADO);
        comandaRepository.save(c);

        // 🔔 NOTIFICACIÓN DE LOTE COMPLETO
        String identificadorMesa = (c.getNumeroMesa() != null) ? "Mesa N° " + c.getNumeroMesa() : String.valueOf(comandaId);
        String msgNotif = "🔔 ¡Lote Completo! La " + identificadorMesa + " tiene todos sus platos listos en barra.";
        registrarYEnviarNotificacion(msgNotif);
    }

    @Transactional
    public void eliminarItemComanda(Long comandaId, Long detalleId, boolean forzarMerma) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada con ID: " + comandaId));

        if (comanda.getDetalles() == null) return;

        DetalleComanda detalleTarget = comanda.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Línea de comanda no encontrada ID: " + detalleId));

        boolean esMermaReal = forzarMerma || detalleTarget.isImpresoEnCocina();

        if (esMermaReal) {
            detalleTarget.setCanceladoPorCliente(true);
            detalleTarget.setImpresoEnCocina(true);
        } else {
            comanda.getDetalles().remove(detalleTarget);
            detalleTarget.setComanda(null);
        }

        if (!detalleTarget.isCocinado()) {
            detalleTarget.setCocinado(true);
            detalleTarget.setEntregado(true);
        }

        boolean tienePlatosActivosPendientes = comanda.getDetalles().stream()
                .anyMatch(d -> !d.isCanceladoPorCliente() && !d.isCocinado());

        if (!tienePlatosActivosPendientes) {
            comanda.setEstado(EstadoComanda.PREPARADO);
        }

        comandaRepository.save(comanda);
    }

    private void registrarYEnviarNotificacion(String mensaje) {
        Notificacion n = new Notificacion();
        n.setMensaje(mensaje);
        n.setTipo("SUCCESS");
        n.setDestinoPerfil("MESERO");
        n.setLeido(false);
        notificacionRepository.save(n);

        messagingTemplate.convertAndSend("/topic/notificaciones/mozos", mensaje);
    }

    @Transactional
    public void entregarItemFila(Long comandaId, Long detalleId) {
        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new RuntimeException("Comanda no encontrada"));

        DetalleComanda detalle = comanda.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado"));

        detalle.setEntregado(true);

        boolean todosEntregados = comanda.getDetalles().stream()
                .filter(d -> !d.isCanceladoPorCliente())
                .allMatch(DetalleComanda::isEntregado);

        if (todosEntregados) {
            comanda.setEstado(EstadoComanda.ENTREGADO);
        }

        comandaRepository.save(comanda);
    }
}