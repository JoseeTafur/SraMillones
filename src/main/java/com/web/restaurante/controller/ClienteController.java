package com.web.restaurante.controller;

import com.web.restaurante.dto.cliente.ClienteSaveDTO;
import com.web.restaurante.service.ClienteService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@Controller
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;

    @GetMapping
    public ResponseEntity<?> buscar(
            @RequestParam(defaultValue = "1") String estado,
            @RequestParam(defaultValue = "") String texto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseUtil.ok(
                "Data encontrada correctamente",
                clienteService.buscar(estado, texto, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return ResponseUtil.ok("Cliente obtenido correctamente", clienteService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ClienteSaveDTO dto) {
        return ResponseUtil.ok("Cliente creado", clienteService.crear(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@RequestBody ClienteSaveDTO dto, @PathVariable Long id) {
        return ResponseUtil.ok(
                "Cliente actualizado correctamente",
                clienteService.actualizar(dto, id)
        );
    }

    @PatchMapping("/{id}/alternar")
    public ResponseEntity<?> alternarEstado(@PathVariable Long id) {
        return ResponseUtil.ok("Estado actualizado correctamente", clienteService.alternarEstado(id));
    }

    @DeleteMapping("/{id}/eliminar")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseUtil.ok("Cliente eliminado correctamente");
    }
}
