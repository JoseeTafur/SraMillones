package com.web.restaurante.controller;

import com.web.restaurante.model.DetallePedido;
import com.web.restaurante.model.Mesa;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.Producto;
import com.web.restaurante.model.InsumoProducto;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.PedidoRepository;
import com.web.restaurante.repository.ProductoRepository;
import com.web.restaurante.repository.InsumoProductoRepository;
import com.web.restaurante.service.CajaOperativaService;
import com.web.restaurante.service.CocinaService;
import com.web.restaurante.service.PedidoService;
import com.web.restaurante.service.TurnoCajaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin/mesero")
@RequiredArgsConstructor
public class  MeseroController {

    private final PedidoService pedidoService;
    private final CocinaService cocinaService;
    private final CajaOperativaService cajaOperativaService;

    @GetMapping("/nuevo")
    public String nuevoPedido(Model model, HttpSession session,
                              @RequestParam(required = false) Long mesaId,
                              @RequestParam(required = false) String pedidoId) {

        if (session.getAttribute("usuarioLogueado") == null) return "redirect:/login";

        Long pedidoIdCorrecto = null;
        if (pedidoId != null && !pedidoId.trim().isEmpty() && !"null".equalsIgnoreCase(pedidoId.trim())) {
            try {
                pedidoIdCorrecto = Long.parseLong(pedidoId.trim());
            } catch (NumberFormatException e) {
                System.out.println("Formato de comanda corrupto interceptado: " + pedidoId);
            }
        }

        model.addAttribute("activeUri", "/admin/mesas");
        model.addAttribute("titleHeader", "Comandera / Mesa N° " + (mesaId != null ? mesaId : ""));

        if (mesaId == null) {
            return "redirect:/admin/mesas";
        }

        Map<Long, Boolean> productosAgotados = pedidoService.productosAgotados(mesaId, pedidoId);
        List<Producto> listaProductos = pedidoService.listaProductos();

        model.addAttribute("productos", listaProductos);
        model.addAttribute("productosAgotados", productosAgotados);
        model.addAttribute("mesaId", mesaId);

        if (pedidoIdCorrecto != null) {
            model.addAttribute("pedidoId", pedidoIdCorrecto);
        }

        return "admin/mesero_pedido";
    }

    @PostMapping("/guardar")
    @ResponseBody
    public String guardarPedido(@RequestBody Pedido pedidoDeFrontend,
                                @RequestParam(required = false) Long mesaId,
                                HttpSession session) {
        try {
            pedidoService.guardarPedido(pedidoDeFrontend, mesaId);
            return "OK";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    @PostMapping("/comanda/eliminar-item")
    @ResponseBody
    public ResponseEntity<String> eliminarItemDesdeSalon(@RequestParam Long pedidoId, @RequestParam Long detalleId, @RequestParam("esMerma") boolean esMerma) {
        try {
            cocinaService.eliminarItemComanda(pedidoId, detalleId, esMerma);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/marcar-en-mesa/{id}")
    @ResponseBody
    public ResponseEntity<String> marcarPedidoEnMesa(@PathVariable Long id) {
        try {
            pedidoService.marcarPedidoEnMesa(id);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/finalizar-atencion/{id}")
    @ResponseBody
    public ResponseEntity<String> finalizarPedidoLocal(@PathVariable Long id,
                                                       @RequestParam(required = false) Long mesaId) {
        try {
            pedidoService.finalizarPedidoLocal(id, mesaId);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/preparar-cuenta/{id}")
    @ResponseBody
    public ResponseEntity<String> prepararCuenta(@PathVariable Long id) {
        try {
            cajaOperativaService.prepararCuenta(id);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}