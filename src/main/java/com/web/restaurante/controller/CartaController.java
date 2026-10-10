package com.web.restaurante.controller;

import com.web.restaurante.model.*;
import com.web.restaurante.service.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CartaController {

    private final CloudinaryService cloudinaryService;
    private final GroqService groqService;
    private final CartaService cartaService;
    private final CajaOperativaService cajaOperativaService; // <-- Reemplaza a PedidoService

    @GetMapping("/carta")
    public String verCarta(Model model) {
        Map<Long, Boolean> productosAgotados = cartaService.productosAgotados();
        List<Producto> listaProductos = cartaService.productos();

        model.addAttribute("categorias", cartaService.categoria());
        model.addAttribute("productos", listaProductos);
        model.addAttribute("productosAgotados", productosAgotados);
        return "entregas/carta";
    }

    @PostMapping(value = "/carta/pedido", consumes = {"multipart/form-data"})
    @Transactional
    public ResponseEntity<?> recibirPedidoCarta(@RequestPart("pedido") Pedido pedido) {
        try {
            Long idPedido = cartaService.recibirPedidoCarta(pedido);
            return ResponseEntity.ok(Map.of("success", true, "id", idPedido));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping(value = "/carta/validar-voucher", consumes = {"multipart/form-data"})
    public ResponseEntity<?> validarVoucherEnCaliente(
            @RequestParam("metodoPago") String metodoPago,
            @RequestParam("montoEsperado") double montoTotal,
            @RequestPart("voucher") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "🚨 Falta adjuntar el voucher."));
            }

            String urlVoucherCloudinary = cloudinaryService.subirImagen(file, "vouchers-lajama");
            Map<String, Object> datosIA = groqService.analizarImagenVoucher(urlVoucherCloudinary);

            String destinoIA = (String) datosIA.get("destino");
            String nroOperacion = (String) datosIA.get("numero_operacion");

            if (destinoIA == null || "null".equalsIgnoreCase(destinoIA.trim())) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "🚨 La imagen subida no es un comprobante válido de Yape o Plin."));
            }

            Number montoNum = (Number) datosIA.get("monto");
            double montoIA = montoNum != null ? montoNum.doubleValue() : 0.0;

            if ("YAPE".equalsIgnoreCase(metodoPago) && "PLIN".equalsIgnoreCase(destinoIA)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "reason", "METODO_EQUIVOCADO", "message", "Subiste un comprobante de PLIN, por favor sube el comprobante en el método de pago correcto (YAPE)."));
            }
            if ("PLIN".equalsIgnoreCase(metodoPago) && "YAPE".equalsIgnoreCase(destinoIA)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "reason", "METODO_EQUIVOCADO", "message", "Subiste un comprobante de YAPE, por favor sube el comprobante en el método de pago correcto (PLIN)."));
            }
            if (!metodoPago.equalsIgnoreCase(destinoIA) && !"TRANSFERENCIA".equalsIgnoreCase(metodoPago)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "reason", "METODO_EQUIVOCADO", "message", "El comprobante no corresponde al método de pago seleccionado."));
            }

            java.time.LocalDateTime ahora = java.time.LocalDateTime.now();
            int diaHoy = ahora.getDayOfMonth();
            int anioHoyFull = ahora.getYear();
            int anioHoyShort = anioHoyFull % 100;
            String[] mesesMap = {"ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"};
            String mesHoy = mesesMap[ahora.getMonthValue() - 1];

            Number diaNum = (Number) datosIA.get("dia");
            Number anioNum = (Number) datosIA.get("anio");
            String mesIA = (String) datosIA.get("mes");

            int diaIA = diaNum != null ? diaNum.intValue() : 0;
            int anioIA = anioNum != null ? anioNum.intValue() : 0;

            boolean añoEsCorrecto = (anioIA == anioHoyFull || anioIA == anioHoyShort);

            if (diaHoy != diaIA || mesIA == null || !mesHoy.equalsIgnoreCase(mesIA.trim()) || !añoEsCorrecto) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "El comprobante detectado es del año/fecha incorrecta (" + diaIA + " de " + (mesIA != null ? mesIA : "null") + " del " + anioIA + "). La compra requiere obligatoriamente la fecha de hoy: " + diaHoy + " de " + mesHoy + " del " + anioHoyFull + "."
                ));
            }

            if (Math.abs(montoIA - montoTotal) > 0.20) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "🚨 Error de Monto: El monto detectado en la captura (S/ " + montoIA + ") no coincide con el total de tu pedido (S/ " + montoTotal + ")."));
            }

            if (nroOperacion == null || nroOperacion.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "La IA no pudo leer con nitidez el número de operación. Intente con otra captura clara."));
            }

            // Usamos CajaOperativaService para validar el número de operación del voucher
            if (cajaOperativaService.existeNumeroOperationHoy(nroOperacion.trim())) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "🚨 Intento de Estafa: Este número de operación (" + nroOperacion.trim() + ") ya fue registrado y aprobado el día de hoy en La Jama."));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "numeroOperacion", nroOperacion.trim(),
                    "imgUrl", urlVoucherCloudinary
            ));

        } catch (Exception e) {
            System.err.println("💥 Error en validador de voucher: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Error interno al procesar con la IA: " + e.getMessage()));
        }
    }
}