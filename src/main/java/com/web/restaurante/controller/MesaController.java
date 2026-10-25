package com.web.restaurante.controller;

import com.web.restaurante.dto.mesas.*;
import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.Mesa;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.enums.MetodoPago;
import com.web.restaurante.dto.mesas.*;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.PedidoRepository;
import com.web.restaurante.service.CocinaService;
import com.web.restaurante.service.MesaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.web.restaurante.service.ComandaService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mesas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MesaController {

    private final MesaService mesaService;
    private final CocinaService cocinaService;
    private final MesaRepository mesaRepository;
    private final PedidoRepository pedidoRepository;
    private final ComandaService comandaService;

    // 1. Obtener estado del plano de salón
    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenerPlanoSalon() {
        List<MesaDTO> mesasDTO = mesaService.obtenerMesasParaSalon();
        List<Comanda> comandasActivas = mesaService.obtenerPedidosActivos();

        Map<String, Object> response = new HashMap<>();
        response.put("mesas", mesasDTO);
        response.put("comandas", comandasActivas);
        response.put("pedidos", comandasActivas); // Mantiene fallback para compatibilidad

        return ResponseEntity.ok(response);
    }

    // 2. Obtener precuenta de mesa
    @GetMapping("/precuenta/{numeroMesa}")
    public ResponseEntity<?> obtenerPrecuenta(@PathVariable Integer numeroMesa) {
        Map<String, Object> precuenta = mesaService.generarPrecuenta(numeroMesa);
        if (precuenta == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(precuenta);
    }

    // 3. Entregar plato completo en mesa
    @PostMapping("/{idMesa}/entregar-plato")
    public ResponseEntity<Map<String, Object>> entregarPlato(@PathVariable Integer idMesa) {
        mesaService.entregarPlatoEnMesa(idMesa);
        return ResponseEntity.ok(Map.of("success", true, "message", "Platos marcados como entregados."));
    }

    // 4. Entregar ítem individual de comanda
    @PostMapping("/entregar-item")
    public ResponseEntity<?> entregarItemIndividual(@RequestParam Long comandaId, @RequestParam Long detalleId) {
        try {
            mesaService.entregarPlatoIndividual(comandaId, detalleId);
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Plato entregado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // 5. Eliminar ítem de comanda (o marcar como merma)
    @PostMapping("/comanda/eliminar-item")
    public ResponseEntity<Map<String, Object>> eliminarItemComanda(
            @RequestParam Long pedidoId,
            @RequestParam Long detalleId,
            @RequestParam(value = "esMerma", defaultValue = "false") boolean esMerma) {

        cocinaService.eliminarItemComanda(pedidoId, detalleId, esMerma);

        Pedido pedidoActualizado = pedidoRepository.findById(pedidoId)
                .orElse(null);

        if (pedidoActualizado != null) {
            long platosActivos = 0;
            long mermasPorPagar = 0;

            if (pedidoActualizado.getListaDetalles() != null) {
                platosActivos = pedidoActualizado.getListaDetalles().stream()
                        .filter(d -> !d.isCanceladoPorCliente())
                        .count();

                mermasPorPagar = pedidoActualizado.getListaDetalles().stream()
                        .filter(d -> d.isCanceladoPorCliente() && !d.isPagado())
                        .count();
            }

            if (platosActivos == 0 && mermasPorPagar == 0) {
                Mesa mesaAsociada = mesaRepository.findByNumero(pedidoActualizado.getNumeroMesa()).orElse(null);
                if (mesaAsociada != null) {
                    mesaAsociada.setEstado("DISPONIBLE");
                    mesaRepository.save(mesaAsociada);
                }
                pedidoActualizado.setEstado(com.web.restaurante.model.enums.EstadoPedido.CANCELADO);
                pedidoRepository.save(pedidoActualizado);

                return ResponseEntity.ok(Map.of("success", true, "message", "Mesa liberada automáticamente por comanda vacía."));
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Producto removido correctamente y transformado en merma cobrable."));
    }

    // 6. ⇆ CAMBIAR DE MESA (Trasladar Comanda)
    @PostMapping("/trasladar")
    public ResponseEntity<Map<String, Object>> trasladarMesa(@Valid @RequestBody TrasladoMesaDTO dto) {
        mesaService.trasladarComandaDeMesa(dto.getIdMesaOrigen(), dto.getIdMesaDestino());
        return ResponseEntity.ok(Map.of("success", true, "message", "Comanda trasladada con éxito."));
    }

    // 7. ψ DIVIDIR COMANDA (Trasladar platos por número de mesa)
    @PostMapping("/dividir-comanda")
    public ResponseEntity<Map<String, Object>> dividirYTrasladarPlatos(@Valid @RequestBody DividirComandaDTO dto) {
        Mesa mesaOrigen = mesaRepository.findById(dto.getIdMesaOrigen())
                .orElseThrow(() -> new RuntimeException("La mesa de origen N° " + dto.getIdMesaOrigen() + " no existe."));

        comandaService.dividirComandaParcial(
            mesaOrigen.getNumero(), 
            dto.getNumeroMesaDestino(), 
            dto.getIdsDetalles()
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Platos divididos y trasladados correctamente."));
    }

    // 8. 🔗 AGRUPAR MESAS (Unificar)
    @PostMapping("/unificar")
    public ResponseEntity<Map<String, Object>> unificarMesas(@Valid @RequestBody UnificarMesasDTO dto) {
        mesaService.unificarMesas(dto.getIdMesaPrincipal(), dto.getIdsMesasHijas());
        return ResponseEntity.ok(Map.of("success", true, "message", "Mesas unificadas con éxito."));
    }

    // 9. Desagrupar mesa completa
    @PostMapping("/{idMesaPadre}/desagrupar")
    public ResponseEntity<Map<String, Object>> desagruparGrupoCompleto(@PathVariable Long idMesaPadre) {
        mesaService.desagruparGrupoCompleto(idMesaPadre);
        return ResponseEntity.ok(Map.of("success", true, "message", "Grupo de mesas disuelto con éxito."));
    }

    // 10. Desvincular mesa individual
    @PostMapping("/{idMesa}/desvincular")
    public ResponseEntity<Map<String, Object>> desvincularMesa(@PathVariable Long idMesa) {
        mesaService.desvincularMesa(idMesa);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mesa desvinculada del grupo."));
    }

    // 11. 📅 MUDAR A RESERVAS (Masivo)
    @PostMapping("/mudar-reserva-masivo")
    public ResponseEntity<Map<String, Object>> trasladarAReservaMasivo(@Valid @RequestBody MudarReservaMasivoDTO dto) {
        mesaService.mudarMesasAReservaEnBloque(dto.getIdsMesas());
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "message", "Lote de " + dto.getIdsMesas().size() + " mesas movido a reservas con éxito."
        ));
    }

    // 12. Quitar de Reservas (Masivo)
    @PostMapping("/quitar-reserva-masivo")
    public ResponseEntity<Map<String, Object>> quitarDeReservaMasivo(@Valid @RequestBody MudarReservaMasivoDTO dto) {
        mesaService.liberarMesasDeReservaEnBloque(dto.getIdsMesas());
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "message", "Lote de " + dto.getIdsMesas().size() + " mesas devuelto al salón ordinario."
        ));
    }

    @PostMapping("/liquidar-multiticket/{pedidoId}")
    public ResponseEntity<Map<String, Object>> liquidarBloqueMultiticket(
            @PathVariable Long pedidoId,
            @Valid @RequestBody LiquidarMultiticketDTO dto) {

        mesaService.procesarLiquidacionMultiticket(pedidoId, dto.getMesaId(), dto.getListaTickets(), dto.getIdsDetallesPagados());
        return ResponseEntity.ok(Map.of("success", true, "message", "Cobro multiticket procesado e independizado correctamente."));
    }

    @PostMapping("/procesar-cobro")
    public ResponseEntity<Map<String, Object>> procesarCobroComanda(@RequestBody Map<String, Object> payload) {
        try {
            Long comandaId = Long.valueOf(payload.get("comandaId").toString());
            Long mesaId = Long.valueOf(payload.get("mesaId").toString());
            
            @SuppressWarnings("unchecked")
            List<Integer> idsRaw = (List<Integer>) payload.get("idsDetallesPagados");
            List<Long> idsDetalles = idsRaw != null 
                ? idsRaw.stream().map(Long::valueOf).toList() 
                : List.of();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> ticketsRaw = (List<Map<String, Object>>) payload.get("tickets");

            mesaService.procesarCobroMultiTicket(comandaId, mesaId, idsDetalles, ticketsRaw);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Cobro registrado exitosamente."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // 14. Liberar mesa o cobro directo
    @PostMapping("/{idMesa}/liberar")
    public ResponseEntity<Map<String, Object>> liberarMesa(@PathVariable Long idMesa) {
        mesaService.liberarYFacturarMesa(idMesa);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mesa liberada con éxito."));
    }

    // 15. Liberar mesa manual por número
    @PostMapping("/liberar-manual/{numeroMesa}")
    public ResponseEntity<Map<String, Object>> liberarMesaManual(@PathVariable Integer numeroMesa) {
        mesaService.liberarMesaManual(numeroMesa);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mesa liberada manualmente."));
    }
}