package com.web.restaurante.controller.V2;

import com.web.restaurante.dto.pago.ObservacionDTO;
import com.web.restaurante.dto.pago.PagoDigitalSaveDTO;
import com.web.restaurante.dto.pago.PagoImagenSaveDTO;
import com.web.restaurante.service.PagoDigitalService;
import com.web.restaurante.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.API_V2_ADMIN + "/pagos-digitales")
@RequiredArgsConstructor
public class PagoDigitalControllerV2 {

    private final PagoDigitalService pagoDigitalService;

    @GetMapping("/listar")
    @ResponseBody
    public ResponseEntity<?> listarTodos() {
        return ResponseUtil.ok("Pagos obtenidos correctamente", pagoDigitalService.listarTodos());
    }

    @GetMapping("/obtener/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return ResponseUtil.ok("Pago obtenido correctamente", pagoDigitalService.obtener(id));
    }

    @PostMapping("/guardar")
    @ResponseBody
    public ResponseEntity<?> crear(@RequestBody PagoDigitalSaveDTO dto) {
        return ResponseUtil.ok("Pago guardado correctamente", pagoDigitalService.crear(dto));
    }

    @PutMapping("/actualizar/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizar(@RequestBody PagoDigitalSaveDTO dto, @PathVariable Long id) {
        return ResponseUtil.ok("Pago guardado correctamente", pagoDigitalService.actualizar(dto, id));
    }

    @PatchMapping("/actualizar-imagen/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarImagen(@RequestBody PagoImagenSaveDTO dto, @PathVariable Long id) {
        return ResponseUtil.ok("Pago guardado correctamente", pagoDigitalService.actualizarImagen(dto, id));
    }

    @PatchMapping("/aprobar/{id}")
    @ResponseBody
    public ResponseEntity<?> aprobar(@RequestBody ObservacionDTO dto, @PathVariable Long id) {
        return ResponseUtil.ok("Pago aprobado", pagoDigitalService.aprobar(dto, id));
    }

    @PatchMapping("/anular/{id}")
    @ResponseBody
    public ResponseEntity<?> anular(@RequestBody ObservacionDTO dto, @PathVariable Long id) {
        return ResponseUtil.ok("Pago anulado", pagoDigitalService.anular(dto, id));
    }

    @PutMapping("/actualizar-datos/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarDatosManuales(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            pagoDigitalService.rectificarDatosYVoucher(
                    id,
                    payload.get("clienteCorreo"),
                    payload.get("numDocumento"),
                    payload.get("imagenBase64")
            );
            return ResponseUtil.ok("¡Datos y voucher rectificados correctamente!", null);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
