package com.web.restaurante.controller;

import com.web.restaurante.dto.ReservaRequestDTO;
import com.web.restaurante.model.Reserva;
import com.web.restaurante.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // Puerto por defecto de Vite / React
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping
    public ResponseEntity<List<Reserva>> listarTodas() {
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<Reserva> crear(@Valid @RequestBody ReservaRequestDTO dto) {
        Reserva reserva = new Reserva();
        reserva.setNombreCliente(dto.getNombreCliente());
        reserva.setTelefono(dto.getTelefono());
        reserva.setNumeroPersonas(dto.getNumeroPersonas());
        reserva.setFechaHoraReserva(dto.getFechaHora());
        reserva.setObservacion(dto.getObservacion() != null && !dto.getObservacion().isBlank() ? dto.getObservacion() : null);

        Reserva creada = reservaService.crearReserva(reserva);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> editar(@PathVariable Long id, @Valid @RequestBody ReservaRequestDTO dto) {
        reservaService.editarReserva(
                id, 
                dto.getNombreCliente(), 
                dto.getTelefono(), 
                dto.getNumeroPersonas(), 
                dto.getFechaHora(), 
                dto.getObservacion()
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/confirmar-llegada")
    public ResponseEntity<Void> confirmarLlegada(@PathVariable Long id) {
        reservaService.confirmarLlegada(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id) {
        reservaService.cancelarReserva(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reservaService.eliminarReserva(id);
        return ResponseEntity.noContent().build();
    }
}