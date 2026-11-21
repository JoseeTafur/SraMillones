package com.web.restaurante.service;

import com.web.restaurante.model.Notificacion;
import com.web.restaurante.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    @Transactional
    public void crear(String tipo, String mensaje, String destinoPerfil, String rutaDestino, Long idReferencia) {
        Notificacion n = new Notificacion();
        n.setTipo(tipo);
        n.setMensaje(mensaje);
        n.setDestinoPerfil(destinoPerfil != null ? destinoPerfil.toUpperCase() : "ADMIN");
        n.setRutaDestino(rutaDestino);
        n.setIdReferencia(idReferencia);
        n.setLeido(false);
        notificacionRepository.save(n);
    }

    @Transactional
    public void resolverPorReferencia(String tipo, Long idReferencia) {
        if (idReferencia == null) return;
        List<Notificacion> pendientes = notificacionRepository.findByTipoAndIdReferenciaAndLeidoFalse(tipo, idReferencia);
        if (!pendientes.isEmpty()) {
            pendientes.forEach(n -> n.setLeido(true));
            notificacionRepository.saveAll(pendientes);
        }
    }
}