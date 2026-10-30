package com.web.restaurante.service;

import com.web.restaurante.model.Pedido;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    // Eliminamos la inyección del JavaMailSender para que Spring Boot no la busque al arrancar.

    @Async
    public void enviarComprobante(String destinatario, Pedido pedido) {
        // El método se queda completamente vacío. 
        // Cuando tus controladores lo llamen, pasará por aquí sin hacer nada y no romperá tu app.
    }
}
