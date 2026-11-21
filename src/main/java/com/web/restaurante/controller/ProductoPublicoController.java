package com.web.restaurante.controller;

import com.web.restaurante.service.GroqVoucherService;
import com.web.restaurante.service.ProductoService;
import com.web.restaurante.service.CloudinaryService;
import com.web.restaurante.service.CartaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/carta")
@RequiredArgsConstructor
public class ProductoPublicoController {

    private final ProductoService productoService;
    private final GroqVoucherService groqVoucherService;
    private final CloudinaryService cloudinaryService;
    private final CartaService cartaService;

    @GetMapping
    public ResponseEntity<?> obtenerCartaPublica() {
        return ResponseEntity.ok(productoService.obtenerCatalogoPublico());
    }

    @PostMapping(value = "/validar-voucher", consumes = "multipart/form-data")
    public ResponseEntity<?> validarVoucher(
            @RequestParam("file") MultipartFile file,
            @RequestParam("total") double total,
            @RequestParam(value = "metodo", defaultValue = "yape") String metodo) {

        Map<String, Object> r = groqVoucherService.validarVoucher(file, total, metodo);

        return ResponseEntity.ok(Map.of(
                "valido", r.get("valido"),
                "monto", r.get("montoDetectado"),
                "mensaje", r.get("mensaje")
        ));
    }
    
    @PostMapping(value = "/pedido-digital", consumes = {"multipart/form-data"})
@ResponseBody
public ResponseEntity<?> registrarPedidoDigitalDesdeCarta(
            @RequestPart("voucher") MultipartFile file,
            @RequestParam(value = "clienteNombre", required = false) String clienteNombre,
            @RequestParam("metodoPago") String metodoPago,
            @RequestParam(value = "tipoAtencion", defaultValue = "DELIVERY") String tipoAtencion,
            @RequestParam(value = "numeroOperacion", required = false) String numeroOperacion,
            @RequestParam("itemsJson") String itemsJson
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Falta adjuntar la captura del comprobante."));
            }

            String urlVoucherCloudinary = cloudinaryService.subirImagen(file, "vouchers-lajama");

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Map<String, Object>> items = mapper.readValue(itemsJson, List.class);

            Long idPagoDigital = cartaService.registrarSolicitudPagoDigital(
                    clienteNombre,
                    metodoPago,
                    tipoAtencion,
                    numeroOperacion,
                    urlVoucherCloudinary,
                    items,
                    mapper
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "idPagoDigital", idPagoDigital,
                    "message", "Solicitud registrada correctamente."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Error al registrar pedido: " + e.getMessage()));
        }
    }
}