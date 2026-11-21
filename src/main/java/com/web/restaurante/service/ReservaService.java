package com.web.restaurante.service;

import com.web.restaurante.model.Mesa;
import com.web.restaurante.model.Reserva;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;
    private final MesaService mesaService;
    private static final int CAPACIDAD_POR_MESA = 4;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificacionService notificacionService;
    private final AuditoriaService auditoriaService;

    public List<Reserva> listarTodas() {
        return reservaRepository.findAllByOrderByFechaHoraReservaDesc();
    }

    @Transactional
    public Reserva crearReserva(Reserva reserva) {
        int mesasNecesarias = (int) Math.ceil((double) reserva.getNumeroPersonas() / CAPACIDAD_POR_MESA);
        List<Mesa> mesasDisponibles = mesaRepository.findAll().stream()
                .filter(m -> ("DISPONIBLE".equals(m.getEstado()) || "LIBRE".equals(m.getEstado()))
                        && m.getMesaPadre() == null)
                .limit(mesasNecesarias)
                .collect(Collectors.toList());

        if (mesasDisponibles.size() < mesasNecesarias) {
            throw new IllegalStateException("No hay suficientes mesas disponibles. Se necesitan " + mesasNecesarias + " mesa(s).");
        }

        String mesasStr = mesasDisponibles.stream()
                .map(m -> "Mesa #" + m.getNumero())
                .collect(Collectors.joining(", "));

        reserva.setMesasAsignadas(mesasStr);
        reserva.setNumeroMesa(mesasDisponibles.get(0).getNumero());
        reserva.setEstado(Reserva.EstadoReserva.CONFIRMADA);
        reserva.setCantidadPersonas(reserva.getNumeroPersonas());

        Reserva guardada = reservaRepository.save(reserva);

        if (guardada.getFechaHoraReserva() != null
                && guardada.getFechaHoraReserva().toLocalDate().equals(LocalDate.now())) {
            String horaStr = guardada.getFechaHoraReserva().format(DateTimeFormatter.ofPattern("hh:mm a"));
            notificacionService.crear(
                    "RESERVA",
                    "📅 Nueva reserva para HOY (" + horaStr + "): " + guardada.getNombreCliente() + " (" + guardada.getNumeroPersonas() + " pers.) - " + mesasStr,
                    "TODOS",
                    "/admin/reservas",
                    guardada.getId()
            );
        }

        auditoriaService.registrar(
                "RESERVAS",
                "CREAR_RESERVA",
                "Reserva",
                guardada.getId(),
                "Reserva creada para " + guardada.getNombreCliente() + " (" + guardada.getNumeroPersonas() + " pers.) - " + mesasStr,
                null,
                "Cliente: " + guardada.getNombreCliente() + " | Fecha: " + guardada.getFechaHoraReserva() + " | Mesas: " + mesasStr
        );

        return guardada;
    }

    @Transactional
    public Reserva confirmarLlegada(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        if (reserva.getMesasAsignadas() != null) {
            List<Mesa> mesasReserva = mesaRepository.findAll().stream()
                    .filter(m -> reserva.getMesasAsignadas().contains("Mesa #" + m.getNumero()))
                    .collect(Collectors.toList());
            if (mesasReserva.size() == 1) {
                Mesa m = mesasReserva.get(0);
                m.setEstado("OCUPADA");
                mesaRepository.save(m);
            } else if (mesasReserva.size() > 1) {
                Mesa padre = mesasReserva.get(0);
                padre.setEstado("OCUPADA");
                mesaRepository.save(padre);
                List<Long> idsHijas = mesasReserva.subList(1, mesasReserva.size())
                        .stream().map(Mesa::getId).collect(Collectors.toList());
                mesaService.unificarMesas(padre.getId(), idsHijas);
            }
        }
        reserva.setEstado(Reserva.EstadoReserva.COMPLETADA);
        Reserva guardada = reservaRepository.save(reserva);

        notificacionService.resolverPorReferencia("RESERVA", guardada.getId());

        auditoriaService.registrar(
                "RESERVAS",
                "CONFIRMAR_LLEGADA",
                "Reserva",
                guardada.getId(),
                "Llegada confirmada de " + guardada.getNombreCliente() + " (" + guardada.getMesasAsignadas() + ")",
                "Estado: CONFIRMADA/PENDIENTE",
                "Estado: COMPLETADA"
        );

        return guardada;
    }

    @Transactional
    public Reserva cancelarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        if (reserva.getMesasAsignadas() != null) {
            mesaRepository.findAll().stream()
                    .filter(m -> reserva.getMesasAsignadas().contains("Mesa #" + m.getNumero()))
                    .forEach(m -> {
                        m.setEstado("DISPONIBLE");
                        mesaRepository.save(m);
                    });
        }
        reserva.setEstado(Reserva.EstadoReserva.CANCELADA);
        Reserva guardada = reservaRepository.save(reserva);

        notificacionService.resolverPorReferencia("RESERVA", guardada.getId());

        auditoriaService.registrar(
                "RESERVAS",
                "CANCELAR_RESERVA",
                "Reserva",
                guardada.getId(),
                "Reserva cancelada de " + guardada.getNombreCliente() + " (mesas liberadas: " + guardada.getMesasAsignadas() + ")",
                "Estado anterior: ACTIVA",
                "Estado nuevo: CANCELADA"
        );

        return guardada;
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void vigilarRelojDeReservas() {
        LocalDateTime ahora = LocalDateTime.now();

        List<Reserva> activas = reservaRepository.findAll().stream()
                .filter(r -> r.getEstado() == Reserva.EstadoReserva.CONFIRMADA
                        || r.getEstado() == Reserva.EstadoReserva.PENDIENTE)
                .toList();

        for (Reserva r : activas) {
            LocalDateTime horaPactada = r.getFechaHoraReserva();

            if (r.getEstado() == Reserva.EstadoReserva.CONFIRMADA
                    && ahora.isAfter(horaPactada.minusMinutes(5)) && ahora.isBefore(horaPactada)) {

                long mins = java.time.Duration.between(ahora, horaPactada).toMinutes() + 1;
                String msg = "⏳ La reserva de " + r.getNombreCliente() + " está por empezar en " + mins + " minutos (" + r.getMesasAsignadas() + ").";

                r.setEstado(Reserva.EstadoReserva.PENDIENTE);
                reservaRepository.save(r);

                registrarAlertaFisica(msg, "RESERVA", "MESERO", r.getId());
            } else if (r.getEstado() == Reserva.EstadoReserva.PENDIENTE
                    && !ahora.isBefore(horaPactada)
                    && ahora.isBefore(horaPactada.plusMinutes(2))) {

                int mesasEstimadas = (int) Math.ceil((double) r.getNumeroPersonas() / CAPACIDAD_POR_MESA);
                String msg = "🚨 ¡La reserva de " + r.getNombreCliente() + " ya empezó! Se requieren " + mesasEstimadas + " mesa(s).";

                r.setEstado(Reserva.EstadoReserva.COMPLETADA);
                reservaRepository.save(r);

                registrarAlertaFisica(msg, "RESERVA", "MESERO", r.getId());
            } else if (r.getEstado() == Reserva.EstadoReserva.PENDIENTE && ahora.isAfter(horaPactada.plusMinutes(2))) {
                r.setEstado(Reserva.EstadoReserva.EXPIRADA);
                reservaRepository.save(r);

                if (r.getMesasAsignadas() != null) {
                    mesaRepository.findAll().stream()
                            .filter(m -> r.getMesasAsignadas().contains("Mesa #" + m.getNumero()))
                            .forEach(m -> {
                                m.setEstado("DISPONIBLE");
                                mesaRepository.save(m);
                            });
                }

                String msg = "⚠️ RESERVA VENCIDA: Se agotó el tiempo de gracia para " + r.getNombreCliente() + ". Mesas liberadas.";
                registrarAlertaFisica(msg, "RESERVA", "TODOS", r.getId());
            }
        }
    }

    @Transactional
    public Reserva editarReserva(Long id, String nombreCliente, String telefono,
                                 Integer numeroPersonas, LocalDateTime fechaHoraReserva, String observacion) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADA) {
            throw new IllegalStateException("No se puede editar una reserva cancelada.");
        }
        reserva.setNombreCliente(nombreCliente);
        reserva.setTelefono(telefono);
        reserva.setNumeroPersonas(numeroPersonas);
        reserva.setFechaHoraReserva(fechaHoraReserva);
        reserva.setFechaHoraLiberacion(fechaHoraReserva.plusMinutes(
                reserva.getDuracionEstimadaMinutos() != null ? reserva.getDuracionEstimadaMinutos() : 90));
        reserva.setObservacion(observacion == null || observacion.isBlank() ? null : observacion);

        Reserva guardada = reservaRepository.save(reserva);

        auditoriaService.registrar(
                "RESERVAS",
                "EDITAR_RESERVA",
                "Reserva",
                guardada.getId(),
                "Reserva #" + guardada.getId() + " editada (" + guardada.getNombreCliente() + ")",
                null,
                "Cliente: " + guardada.getNombreCliente() + " | Personas: " + guardada.getNumeroPersonas() + " | Fecha: " + guardada.getFechaHoraReserva()
        );

        return guardada;
    }

    @Transactional
    public void eliminarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        if (reserva.getMesasAsignadas() != null) {
            mesaRepository.findAll().stream()
                    .filter(m -> reserva.getMesasAsignadas().contains("Mesa #" + m.getNumero()))
                    .forEach(m -> {
                        if ("RESERVADA".equals(m.getEstado()) || "OCUPADA".equals(m.getEstado())) {
                            m.setEstado("DISPONIBLE");
                            mesaRepository.save(m);
                        }
                    });
        }

        notificacionService.resolverPorReferencia("RESERVA", reserva.getId());

        auditoriaService.registrar(
                "RESERVAS",
                "ELIMINAR_RESERVA",
                "Reserva",
                reserva.getId(),
                "Reserva eliminada de " + reserva.getNombreCliente() + " (Fecha pactada: " + reserva.getFechaHoraReserva() + ")",
                "Reserva #" + reserva.getId() + " | Cliente: " + reserva.getNombreCliente(),
                "ELIMINADA"
        );

        reservaRepository.deleteById(id);
    }

    public Optional<Reserva> obtenerPorId(Long id) {
        return reservaRepository.findById(id);
    }

    @Transactional
    public void registrarAlertaFisica(String mensaje, String tipo, String perfil, Long idReserva) {
        notificacionService.crear(tipo, mensaje, perfil, "/admin/reservas", idReserva);
        messagingTemplate.convertAndSend("/topic/notificaciones/mozos", mensaje);
    }
}