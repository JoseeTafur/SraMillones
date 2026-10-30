package com.web.restaurante.controller;

import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.Producto;
import com.web.restaurante.service.CajaOperativaService;
import com.web.restaurante.service.CocinaService;
import com.web.restaurante.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mesero")
@RequiredArgsConstructor
public class MeseroController {

    private final PedidoService pedidoService;
    private final CocinaService cocinaService;
    private final CajaOperativaService cajaOperativaService;

    // GET /api/mesero/nuevo?mesaId=1&pedidoId=5
    @GetMapping("/nuevo")
    public ResponseEntity<?> obtenerDatosComandera(@RequestParam(required = false) Long mesaId,
                                                    @RequestParam(required = false) String pedidoId) {
        if (mesaId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El parámetro mesaId es requerido."));
        }

        try {
            List<Producto> listaProductos = pedidoService.listaProductos();
            Map<Long, Boolean> productosAgotados = pedidoService.productosAgotados(mesaId, pedidoId);

            Map<String, Object> response = new HashMap<>();
            response.put("mesaId", mesaId);
            response.put("productos", listaProductos);
            response.put("productosAgotados", productosAgotados);

            if (pedidoId != null && !pedidoId.trim().isEmpty() && !"null".equalsIgnoreCase(pedidoId.trim())) {
                try {
                    response.put("pedidoId", Long.parseLong(pedidoId.trim()));
                } catch (NumberFormatException ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error al cargar comandera: " + e.getMessage()));
        }
    }

    // POST /api/mesero/guardar?mesaId=1
    @PostMapping("/guardar")
    public ResponseEntity<?> guardarPedido(@RequestBody Pedido pedidoDeFrontend,
                                           @RequestParam(required = false) Long mesaId) {
        try {
            pedidoService.guardarPedido(pedidoDeFrontend, mesaId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pedido registrado exitosamente."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Error al guardar el pedido: " + e.getMessage()));
        }
    }

    // POST /api/mesero/comanda/eliminar-item
    @PostMapping("/comanda/eliminar-item")
    public ResponseEntity<?> eliminarItemDesdeSalon(@RequestParam Long pedidoId, 
                                                    @RequestParam Long detalleId, 
                                                    @RequestParam("esMerma") boolean esMerma) {
        try {
            cocinaService.eliminarItemComanda(pedidoId, detalleId, esMerma);
            return ResponseEntity.ok(Map.of("success", true, "message", "Ítem removido con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // POST /api/mesero/marcar-en-mesa/{id}
    @PostMapping("/marcar-en-mesa/{id}")
    public ResponseEntity<?> marcarPedidoEnMesa(@PathVariable Long id) {
        try {
            pedidoService.marcarPedidoEnMesa(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pedido marcado en mesa."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // POST /api/mesero/finalizar-atencion/{id}
    @PostMapping("/finalizar-atencion/{id}")
    public ResponseEntity<?> finalizarPedidoLocal(@PathVariable Long id,
                                                  @RequestParam(required = false) Long mesaId) {
        try {
            pedidoService.finalizarPedidoLocal(id, mesaId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Atención finalizada."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // POST /api/mesero/preparar-cuenta/{id}
    @PostMapping("/preparar-cuenta/{id}")
    public ResponseEntity<?> prepararCuenta(@PathVariable Long id) {
        try {
            cajaOperativaService.prepararCuenta(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cuenta preparada para caja."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}