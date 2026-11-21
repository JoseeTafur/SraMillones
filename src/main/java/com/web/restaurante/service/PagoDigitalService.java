package com.web.restaurante.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.web.restaurante.dto.pago.ObservacionDTO;
import com.web.restaurante.dto.pago.PagoDigitalDTO;
import com.web.restaurante.dto.pago.PagoDigitalSaveDTO;
import com.web.restaurante.dto.pago.PagoImagenSaveDTO;
import com.web.restaurante.mapper.PagoDigitalMapper;
import com.web.restaurante.model.DetalleVenta;
import com.web.restaurante.model.PagoDigital;
import com.web.restaurante.model.Producto;
import com.web.restaurante.model.Venta;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.SituacionPagoDigital;
import com.web.restaurante.model.enums.TipoPedido;
import com.web.restaurante.repository.PagoDigitalRepository;
import com.web.restaurante.repository.ProductoRepository;
import com.web.restaurante.repository.VentaRepository;
import com.web.restaurante.service.caja.TurnoCajaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PagoDigitalService {

    private final PagoDigitalRepository pagoDigitalRepository;
    private final PagoDigitalMapper pagoDigitalMapper;
    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final TurnoCajaService turnoCajaService;
    private final NotaVentaSequenceService notaVentaSequenceService;
    private final ObjectMapper objectMapper;
    private final CloudinaryService cloudinaryService;
    private final NotificacionService notificacionService;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<PagoDigitalDTO> listarTodos() {
        return pagoDigitalRepository.findAll()
                .stream().map(pagoDigitalMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public PagoDigitalDTO obtener(Long id) {
        return pagoDigitalMapper.toDTO(requerirPagoPorId(id));
    }

    @Transactional
    public PagoDigitalDTO crear(PagoDigitalSaveDTO dto) {
        PagoDigital pagoDigital = PagoDigital.builder()
                .observacion(dto.observacion())
                .imgUrl(dto.imgUrl())
                .situacion(SituacionPagoDigital.PENDIENTE)
                .build();
        PagoDigital guardado = pagoDigitalRepository.save(pagoDigital);

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "CREAR_PAGO_DIGITAL",
                "PagoDigital",
                guardado.getId(),
                "Nuevo registro de pago digital #" + guardado.getId(),
                null,
                "Situación: PENDIENTE | Obs: " + dto.observacion()
        );

        return pagoDigitalMapper.toDTO(guardado);
    }

    @Transactional
    public PagoDigitalDTO actualizar(PagoDigitalSaveDTO dto, Long id) {
        PagoDigital pago = requerirPagoPorId(id);
        String obsAntes = pago.getObservacion();
        pago.setObservacion(dto.observacion());
        pago.setImgUrl(dto.imgUrl());
        PagoDigital guardado = pagoDigitalRepository.save(pago);

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "ACTUALIZAR_PAGO_DIGITAL",
                "PagoDigital",
                guardado.getId(),
                "Actualizó datos del pago digital #" + guardado.getId(),
                "Obs: " + obsAntes,
                "Obs: " + dto.observacion()
        );

        return pagoDigitalMapper.toDTO(guardado);
    }

    @Transactional
    public PagoDigitalDTO actualizarImagen(PagoImagenSaveDTO dto, Long id) {
        PagoDigital pago = requerirPagoPorId(id);
        pago.setImgUrl(dto.imgUrl());
        PagoDigital guardado = pagoDigitalRepository.save(pago);

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "ACTUALIZAR_IMAGEN_PAGO",
                "PagoDigital",
                guardado.getId(),
                "Actualizó imagen del comprobante en pago digital #" + guardado.getId(),
                null,
                "Nueva imagen registrada"
        );

        return pagoDigitalMapper.toDTO(guardado);
    }

    @Transactional
    public PagoDigitalDTO aprobar(ObservacionDTO dto, Long id) {
        PagoDigital pago = requerirPagoPorId(id);

        if (pago.getSituacion() == SituacionPagoDigital.APROBADO) {
            throw new IllegalStateException("Este pago digital ya fue aprobado anteriormente.");
        }
        if (pago.getSituacion() == SituacionPagoDigital.ANULADO) {
            throw new IllegalStateException("No se puede aprobar un pago digital que ya fue denegado.");
        }

        // 1. Recién aquí nace la Venta oficial
        Venta venta = new Venta();
        venta.setClienteNombre(
                pago.getClienteNombre() != null && !pago.getClienteNombre().isBlank()
                        ? pago.getClienteNombre()
                        : "CLIENTE WEB"
        );
        venta.setDocumentoCliente(pago.getNumeroOperacion());
        venta.setMetodoPago(pago.getMetodoPago());
        venta.setTipoAtencion(pago.getTipoAtencion() != null ? pago.getTipoAtencion() : TipoPedido.DELIVERY);
        venta.setMontoTotal(pago.getMontoTotal() != null ? pago.getMontoTotal() : 0.0);
        venta.setEstadoPago(EstadoPago.PAGADO);
        venta.setTipoComprobante("NOTA_VENTA");
        venta.setNumeroComprobante(notaVentaSequenceService.generarSiguienteNota());

        turnoCajaService.obtenerTurnoActivo().ifPresent(venta::setTurnoCaja);

        // 2. Reconstruir DetalleVenta desde el JSON guardado
        List<DetalleVenta> detalles = construirDetallesDesdeJson(pago.getDetallePedidoJson(), venta);
        venta.setDetalles(detalles);

        Venta ventaGuardada = ventaRepository.save(venta);

        // 3. Registrar ingreso en el turno de Caja activo
        if (ventaGuardada.getMontoTotal() != null && ventaGuardada.getMontoTotal() > 0) {
            String concepto = "Carta Web (" + ventaGuardada.getMetodoPago() + ") - " + ventaGuardada.getNumeroComprobante();
            turnoCajaService.registrarVenta(concepto, ventaGuardada.getMontoTotal());
        }

        // 4. Actualizar estado del PagoDigital y vincular la Venta recién creada
        pago.setVenta(ventaGuardada);
        pago.setSituacion(SituacionPagoDigital.APROBADO);
        pago.setObservacion(dto.observacion());

        PagoDigital actualizado = pagoDigitalRepository.save(pago);

        // 5. Auto-archivar notificación pendiente y registrar bitácora de auditoría
        notificacionService.resolverPorReferencia("PAGO_DIGITAL", pago.getId());

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "APROBAR_PAGO",
                "PagoDigital",
                pago.getId(),
                "Aprobó pago digital #" + pago.getId() + " (" + pago.getMetodoPago() + " S/ " + String.format("%.2f", pago.getMontoTotal()) + ") → " + ventaGuardada.getNumeroComprobante(),
                "Situación: PENDIENTE",
                "Situación: APROBADO | Venta #" + ventaGuardada.getId() + " | Nota: " + ventaGuardada.getNumeroComprobante() + " | Obs: " + dto.observacion()
        );

        return pagoDigitalMapper.toDTO(actualizado);
    }

    @Transactional
    public PagoDigitalDTO anular(ObservacionDTO dto, Long id) {
        PagoDigital pago = requerirPagoPorId(id);

        if (pago.getSituacion() == SituacionPagoDigital.ANULADO) {
            throw new IllegalStateException("Este pago digital ya fue denegado anteriormente.");
        }
        if (pago.getSituacion() == SituacionPagoDigital.APROBADO) {
            throw new IllegalStateException("No se puede denegar un pago que ya fue aprobado.");
        }

        pago.setSituacion(SituacionPagoDigital.ANULADO);
        pago.setObservacion(dto.observacion());

        PagoDigital actualizado = pagoDigitalRepository.save(pago);

        // Auto-archivar notificación pendiente y registrar auditoría de rechazo
        notificacionService.resolverPorReferencia("PAGO_DIGITAL", pago.getId());

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "DENEGAR_PAGO",
                "PagoDigital",
                pago.getId(),
                "Denegó pago digital #" + pago.getId() + " (" + pago.getMetodoPago() + " S/ " + String.format("%.2f", pago.getMontoTotal()) + ")",
                "Situación: PENDIENTE",
                "Situación: ANULADO | Motivo: " + dto.observacion()
        );

        return pagoDigitalMapper.toDTO(actualizado);
    }

    @Transactional(readOnly = true)
    public PagoDigital requerirPagoPorId(Long id) {
        return pagoDigitalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró pago digital con ID: " + id));
    }

    private List<DetalleVenta> construirDetallesDesdeJson(String json, Venta venta) {
        List<DetalleVenta> lista = new ArrayList<>();
        if (json == null || json.isBlank()) return lista;
        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : items) {
                Long idProd = item.get("idProducto") != null ? ((Number) item.get("idProducto")).longValue() : null;
                int cantidad = item.get("cantidad") != null ? ((Number) item.get("cantidad")).intValue() : 1;
                if (idProd == null || cantidad <= 0) continue;

                Producto producto = productoRepository.findById(idProd).orElse(null);
                if (producto == null) continue;

                DetalleVenta det = new DetalleVenta();
                det.setVenta(venta);
                det.setProducto(producto);
                det.setNombreProducto(producto.getNombre());
                det.setCantidad(cantidad);
                det.setPrecioUnitario(producto.getPrecio());
                det.setSubtotal(producto.getPrecio() * cantidad);
                lista.add(det);
            }
        } catch (Exception ignored) {
        }
        return lista;
    }

    @Transactional
    public void rectificarDatosYVoucher(Long id, String clienteNombre, String numDocumento, String imagenBase64) throws java.io.IOException {
        PagoDigital pago = requerirPagoPorId(id);

        String estadoAnterior = "Cliente: " + pago.getClienteNombre() + " | Op: " + pago.getNumeroOperacion();

        if (clienteNombre != null && !clienteNombre.isBlank()) {
            pago.setClienteNombre(clienteNombre.trim());
        }
        if (numDocumento != null && !numDocumento.isBlank()) {
            pago.setNumeroOperacion(numDocumento.trim());
        }

        if (imagenBase64 != null && !imagenBase64.isBlank()) {
            String base64Puro = imagenBase64.contains(",")
                    ? imagenBase64.substring(imagenBase64.indexOf(',') + 1)
                    : imagenBase64;
            byte[] imagenBytes = java.util.Base64.getDecoder().decode(base64Puro);

            if (imagenBytes.length == 0 || imagenBytes.length > 4 * 1024 * 1024) {
                throw new IllegalArgumentException("La imagen rectificada está vacía o supera los 4 MB permitidos.");
            }

            org.springframework.web.multipart.MultipartFile archivoMultipartCustom = new org.springframework.web.multipart.MultipartFile() {
                @Override public String getName() { return "voucher_editado.jpg"; }
                @Override public String getOriginalFilename() { return "voucher_editado.jpg"; }
                @Override public String getContentType() { return "image/jpeg"; }
                @Override public boolean isEmpty() { return imagenBytes.length == 0; }
                @Override public long getSize() { return imagenBytes.length; }
                @Override public byte[] getBytes() { return imagenBytes; }
                @Override public java.io.InputStream getInputStream() {
                    return new java.io.ByteArrayInputStream(imagenBytes);
                }
                @Override public void transferTo(java.io.File dest) throws java.io.IOException {
                    java.nio.file.Files.write(dest.toPath(), imagenBytes);
                }
            };

            String urlSeguraCloudinary = cloudinaryService.subirImagen(archivoMultipartCustom, "vouchers-lajama");
            pago.setImgUrl(urlSeguraCloudinary);
        }

        pagoDigitalRepository.save(pago);

        auditoriaService.registrar(
                "PAGOS_DIGITALES",
                "RECTIFICAR_VOUCHER",
                "PagoDigital",
                pago.getId(),
                "Rectificó datos/imagen del pago digital #" + pago.getId(),
                estadoAnterior,
                "Cliente: " + pago.getClienteNombre() + " | Op: " + pago.getNumeroOperacion()
        );
    }
}