package com.web.restaurante.service;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.DetalleComanda;
import com.web.restaurante.model.Producto;
import com.web.restaurante.model.enums.EstadoComanda;
import com.web.restaurante.repository.ComandaRepository;
import com.web.restaurante.repository.DetalleComandaRepository;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ComandaService {

    private final ComandaRepository comandaRepository;
    private final DetalleComandaRepository detalleComandaRepository;
    private final MesaRepository mesaRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public Optional<Comanda> obtenerPorMesa(Integer numeroMesa) {
        return comandaRepository.findByNumeroMesa(numeroMesa);
    }

    @Transactional
    public Comanda guardarOCambiarComanda(Comanda comandaFrontend, Integer numeroMesa) {
        Optional<Comanda> comandaExistenteOpt = comandaRepository.findByNumeroMesa(numeroMesa);
        boolean esAmpliacion = comandaExistenteOpt.isPresent();
        Comanda comandaFinal;

        if (esAmpliacion) {
            comandaFinal = comandaExistenteOpt.get();
            comandaFinal.setEstado(EstadoComanda.ENTREGADO);
            if (comandaFrontend.getObservaciones() != null) {
                comandaFinal.setObservaciones(comandaFrontend.getObservaciones());
            }

            for (DetalleComanda nuevoDetalle : comandaFrontend.getDetalles()) {
                Producto p = productoRepository.findById(nuevoDetalle.getProducto().getId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                nuevoDetalle.setProducto(p);
                nuevoDetalle.setCocinado(true);
                nuevoDetalle.setEntregado(true);
                comandaFinal.agregarDetalle(nuevoDetalle);
            }
        } else {
            comandaFinal = comandaFrontend;
            comandaFinal.setNumeroMesa(numeroMesa);
            comandaFinal.setFechaApertura(LocalDateTime.now());
            comandaFinal.setEstado(EstadoComanda.ENTREGADO);

            for (DetalleComanda d : comandaFinal.getDetalles()) {
                Producto p = productoRepository.findById(d.getProducto().getId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                d.setProducto(p);
                d.setCocinado(true);
                d.setEntregado(true);
                d.setComanda(comandaFinal);
            }
        }

        if (numeroMesa != null) {
            mesaRepository.findByNumero(numeroMesa).ifPresent(m -> {
                m.setEstado("OCUPADA");
                mesaRepository.save(m);
            });
        }

        Comanda guardada = comandaRepository.save(comandaFinal);

        int cantidadPlatos = comandaFrontend.getDetalles() != null ? comandaFrontend.getDetalles().size() : 0;
        String mensajeAlerta = esAmpliacion
                ? "🍽️ Mesa #" + numeroMesa + " agregó " + cantidadPlatos + " ítem(s) a su comanda."
                : "🆕 Nueva comanda abierta en Mesa #" + numeroMesa + " (" + cantidadPlatos + " ítem(s)).";

        notificacionService.crear(
                "COMANDA",
                mensajeAlerta,
                "CAJERO",
                "/admin/mesas",
                guardada.getId()
        );

        auditoriaService.registrar("COMANDAS", "GUARDAR_COMANDA", "Comanda", guardada.getId(),
                "Comanda registrada/actualizada en Mesa #" + numeroMesa, null, null);
        return guardada;
    }

    @Transactional
    public void liberarMesaManual(Integer numeroMesa) {
        Optional<Comanda> comandaOpt = comandaRepository.findByNumeroMesa(numeroMesa);
        if (comandaOpt.isPresent()) {
            notificacionService.resolverPorReferencia("COMANDA", comandaOpt.get().getId());
            comandaRepository.delete(comandaOpt.get());
        }

        mesaRepository.findByNumero(numeroMesa).ifPresent(m -> {
            m.setEstado("DISPONIBLE");
            mesaRepository.save(m);
        });

        notificacionService.crear(
                "SISTEMA",
                "⚠️ Mesa #" + numeroMesa + " fue liberada manualmente sin cobro en caja.",
                "ADMIN",
                "/admin/mesas",
                null
        );
    }

    @Transactional
    public void trasladarComandaCompleta(Integer numeroMesaOrigen, Integer numeroMesaDestino) {
        Comanda origen = comandaRepository.findByNumeroMesa(numeroMesaOrigen)
                .orElseThrow(() -> new RuntimeException("No existe comanda activa en la mesa origen N° " + numeroMesaOrigen));

        Optional<Comanda> destinoOpt = comandaRepository.findByNumeroMesa(numeroMesaDestino);
        Comanda destino;

        if (destinoOpt.isPresent()) {
            destino = destinoOpt.get();
        } else {
            destino = new Comanda();
            destino.setNumeroMesa(numeroMesaDestino);
            destino.setFechaApertura(origen.getFechaApertura());
            destino.setEstado(origen.getEstado());
            destino = comandaRepository.save(destino);
        }

        List<DetalleComanda> detallesAMover = new ArrayList<>(origen.getDetalles());
        for (DetalleComanda detalle : detallesAMover) {
            origen.removerDetalle(detalle);
            destino.agregarDetalle(detalle);
        }

        comandaRepository.save(destino);
        notificacionService.resolverPorReferencia("COMANDA", origen.getId());
        comandaRepository.delete(origen);

        mesaRepository.findByNumero(numeroMesaOrigen).ifPresent(m -> {
            m.setEstado("DISPONIBLE");
            mesaRepository.save(m);
        });

        mesaRepository.findByNumero(numeroMesaDestino).ifPresent(m -> {
            m.setEstado("OCUPADA");
            mesaRepository.save(m);
        });

        auditoriaService.registrar("COMANDAS", "TRASLADAR_COMANDA", "Comanda", destino.getId(),
                "Traslado de Mesa #" + numeroMesaOrigen + " a Mesa #" + numeroMesaDestino, null, null);
    }

    @Transactional
    public void dividirComandaParcial(Integer numeroMesaOrigen, Integer numeroMesaDestino, List<Long> idsDetalles) {
        Comanda origen = comandaRepository.findByNumeroMesa(numeroMesaOrigen)
                .orElseThrow(() -> new RuntimeException("No existe comanda activa en la mesa origen"));

        Comanda destino = comandaRepository.findByNumeroMesa(numeroMesaDestino)
                .orElseGet(() -> {
                    Comanda nueva = new Comanda();
                    nueva.setNumeroMesa(numeroMesaDestino);
                    nueva.setFechaApertura(LocalDateTime.now());
                    nueva.setEstado(EstadoComanda.ENTREGADO);
                    return comandaRepository.save(nueva);
                });

        List<DetalleComanda> detallesAMover = origen.getDetalles().stream()
                .filter(d -> idsDetalles.contains(d.getId()))
                .toList();

        for (DetalleComanda detalle : detallesAMover) {
            origen.removerDetalle(detalle);
            destino.agregarDetalle(detalle);
        }

        comandaRepository.save(destino);

        if (origen.getDetalles().isEmpty()) {
            notificacionService.resolverPorReferencia("COMANDA", origen.getId());
            comandaRepository.delete(origen);
            mesaRepository.findByNumero(numeroMesaOrigen).ifPresent(m -> {
                m.setEstado("DISPONIBLE");
                mesaRepository.save(m);
            });
        } else {
            comandaRepository.save(origen);
        }

        mesaRepository.findByNumero(numeroMesaDestino).ifPresent(m -> {
            m.setEstado("OCUPADA");
            mesaRepository.save(m);
        });

        auditoriaService.registrar("COMANDAS", "DIVIDIR_COMANDA", "Comanda", destino.getId(),
                "División de comanda de Mesa #" + numeroMesaOrigen + " a Mesa #" + numeroMesaDestino, null, null);
    }

    @Transactional
    public void eliminarDetalleComanda(Long detalleId) {
        DetalleComanda detalle = detalleComandaRepository.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("El detalle solicitado no existe."));

        Comanda comanda = detalle.getComanda();
        String nombrePlato = detalle.getProducto() != null ? detalle.getProducto().getNombre() : "Ítem #" + detalleId;
        Integer mesaNum = comanda != null ? comanda.getNumeroMesa() : null;
        Long comandaId = comanda != null ? comanda.getId() : null;

        if (comanda != null) {
            comanda.removerDetalle(detalle);
            detalleComandaRepository.delete(detalle);

            if (comanda.getDetalles().isEmpty()) {
                notificacionService.resolverPorReferencia("COMANDA", comanda.getId());
                comandaRepository.delete(comanda);
                if (mesaNum != null) {
                    mesaRepository.findByNumero(mesaNum).ifPresent(m -> {
                        m.setEstado("DISPONIBLE");
                        mesaRepository.save(m);
                    });
                }
            } else {
                comandaRepository.save(comanda);
            }
        }

        notificacionService.crear(
                "SISTEMA",
                "🗑️ Se anuló '" + nombrePlato + "' (x" + detalle.getCantidad() + ") de la Mesa #" + mesaNum,
                "ADMIN",
                "/admin/auditoria",
                comandaId
        );

        auditoriaService.registrar("COMANDAS", "ELIMINAR_ITEM", "Comanda", comandaId,
                "Ítem eliminado de Mesa #" + mesaNum, null, null);
    }
}