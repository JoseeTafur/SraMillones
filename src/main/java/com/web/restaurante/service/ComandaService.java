package com.web.restaurante.service;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.DetalleComanda;
import com.web.restaurante.model.Mesa;
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
    private final MesaService mesaService;

    @Transactional(readOnly = true)
    public Optional<Comanda> obtenerPorMesa(Integer numeroMesa) {
        return comandaRepository.findByNumeroMesa(numeroMesa);
    }

    @Transactional
    public Comanda guardarOCambiarComanda(Comanda comandaFrontend, Integer numeroMesa) {
        Optional<Comanda> comandaExistenteOpt = comandaRepository.findByNumeroMesa(numeroMesa);
        Comanda comandaFinal;

        if (comandaExistenteOpt.isPresent()) {
            comandaFinal = comandaExistenteOpt.get();
            // 🟢 Usamos ENTREGADO directamente de tu enum EstadoComanda
            comandaFinal.setEstado(EstadoComanda.ENTREGADO);
            if (comandaFrontend.getObservaciones() != null) {
                comandaFinal.setObservaciones(comandaFrontend.getObservaciones());
            }

            for (DetalleComanda nuevoDetalle : comandaFrontend.getDetalles()) {
                Producto p = productoRepository.findById(nuevoDetalle.getProducto().getId())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                nuevoDetalle.setProducto(p);
                
                // 🟢 Autocompletar banderas sin pasar por cocina
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

        return comandaRepository.save(comandaFinal);
    }

    // 🟢 Liberar Mesa Manualmente
    @Transactional
    public void liberarMesaManual(Integer numeroMesa) {
        Optional<Comanda> comandaOpt = comandaRepository.findByNumeroMesa(numeroMesa);
        if (comandaOpt.isPresent()) {
            comandaRepository.delete(comandaOpt.get());
        }

        mesaRepository.findByNumero(numeroMesa).ifPresent(m -> {
            m.setEstado("DISPONIBLE");
            mesaRepository.save(m);
        });
    }

    @Transactional
public void trasladarComandaCompleta(Integer numeroMesaOrigen, Integer numeroMesaDestino) {
    Comanda origen = comandaRepository.findByNumeroMesa(numeroMesaOrigen)
            .orElseThrow(() -> new RuntimeException("No existe comanda activa en la mesa origen N° " + numeroMesaOrigen));

    // Si la mesa destino ya tiene comanda, usamos esa; si no, creamos una nueva
    Optional<Comanda> destinoOpt = comandaRepository.findByNumeroMesa(numeroMesaDestino);
    Comanda destino;

    if (destinoOpt.isPresent()) {
        destino = destinoOpt.get(); // 🟢 Fusión: Unifica los ítems en la comanda ya existente
    } else {
        destino = new Comanda();
        destino.setNumeroMesa(numeroMesaDestino);
        destino.setFechaApertura(origen.getFechaApertura());
        destino.setEstado(origen.getEstado());
        destino = comandaRepository.save(destino);
    }

    // Reasignamos cada detalle a la comanda destino
    List<DetalleComanda> detallesAMover = new ArrayList<>(origen.getDetalles());
    for (DetalleComanda detalle : detallesAMover) {
        origen.removerDetalle(detalle);
        destino.agregarDetalle(detalle);
    }

    comandaRepository.save(destino);
    comandaRepository.delete(origen); // 🟢 Limpia la comanda de origen

    // Actualizamos los estados de las mesas en salón
    mesaRepository.findByNumero(numeroMesaOrigen).ifPresent(m -> {
        m.setEstado("DISPONIBLE");
        mesaRepository.save(m);
    });

    mesaRepository.findByNumero(numeroMesaDestino).ifPresent(m -> {
        m.setEstado("OCUPADA");
        mesaRepository.save(m);
    });
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
    }

    @Transactional
public void eliminarDetalleComanda(Long detalleId) {
    DetalleComanda detalle = detalleComandaRepository.findById(detalleId)
            .orElseThrow(() -> new RuntimeException("El detalle solicitado no existe."));

    Comanda comanda = detalle.getComanda();
    if (comanda != null) {
        comanda.removerDetalle(detalle);
        detalleComandaRepository.delete(detalle);

        // Si la comanda se quedó vacía, la eliminamos y liberamos la mesa
        if (comanda.getDetalles().isEmpty()) {
            comandaRepository.delete(comanda);
            if (comanda.getNumeroMesa() != null) {
                mesaRepository.findByNumero(comanda.getNumeroMesa()).ifPresent(m -> {
                    m.setEstado("DISPONIBLE");
                    mesaRepository.save(m);
                });
            }
        } else {
            comandaRepository.save(comanda);
        }
    }
}
}