package com.web.restaurante.service;

import com.web.restaurante.model.Categoria;
import com.web.restaurante.model.PagoDigital;
import com.web.restaurante.model.Producto;
import com.web.restaurante.model.Venta;
import com.web.restaurante.model.enums.EstadoPago;
import com.web.restaurante.model.enums.SituacionPagoDigital;
import com.web.restaurante.repository.CategoriaRepository;
import com.web.restaurante.repository.PagoDigitalRepository;
import com.web.restaurante.repository.ProductoRepository;
import com.web.restaurante.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CartaService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final PagoDigitalRepository pagoDigitalRepository;
    private final VentaRepository ventaRepository;
    private final NotificacionService notificacionService;

    public List<Categoria> categoria() {
        return categoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<Long, Boolean> productosAgotados() {
        List<Producto> listaProductos = productoRepository.findByEstado(1);
        Map<Long, Boolean> productosAgotados = new HashMap<>();

        for (Producto p : listaProductos) {
            productosAgotados.put(p.getId(), false);
        }

        return productosAgotados;
    }

    public List<Producto> productos() {
        return productoRepository.findAll();
    }

    @Transactional
    public Long registrarSolicitudPagoDigital(
            String clienteNombre,
            String metodoPagoStr,
            String tipoAtencionStr,
            String numeroOperacion,
            String imgUrl,
            List itemsCarrito,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) throws Exception {
        if (itemsCarrito == null || itemsCarrito.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío.");
        }
        if (imgUrl == null || imgUrl.isBlank()) {
            throw new IllegalArgumentException("Falta la imagen del comprobante.");
        }

        double totalReal = 0.0;
        for (Object obj : itemsCarrito) {
            Map item = (Map) obj;
            Long idProd = ((Number) item.get("idProducto")).longValue();
            int cant = ((Number) item.get("cantidad")).intValue();
            if (cant <= 0) throw new IllegalArgumentException("Cantidad inválida.");

            Producto prod = productoRepository.findById(idProd)
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + idProd));
            if (prod.getEstado() == null || prod.getEstado() != 1) {
                throw new IllegalArgumentException("El plato '" + prod.getNombre() + "' no está disponible.");
            }
            totalReal += prod.getPrecio() * cant;
        }

        if (numeroOperacion != null && !numeroOperacion.isBlank()) {
            boolean duplicado = pagoDigitalRepository.findAll().stream()
                    .anyMatch(p -> p.getSituacion() != SituacionPagoDigital.ANULADO
                            && numeroOperacion.trim().equalsIgnoreCase(p.getNumeroOperacion()));
            if (duplicado) {
                throw new IllegalArgumentException("Este número de operación (" + numeroOperacion + ") ya fue enviado o aprobado.");
            }
        }

        com.web.restaurante.model.enums.MetodoPago metodo =
                com.web.restaurante.model.enums.MetodoPago.valueOf(metodoPagoStr.toUpperCase());
        com.web.restaurante.model.enums.TipoPedido tipo =
                (tipoAtencionStr != null && !tipoAtencionStr.isBlank())
                        ? com.web.restaurante.model.enums.TipoPedido.valueOf(tipoAtencionStr.toUpperCase())
                        : com.web.restaurante.model.enums.TipoPedido.DELIVERY;

        PagoDigital pago = PagoDigital.builder()
                .clienteNombre(clienteNombre != null && !clienteNombre.isBlank() ? clienteNombre.trim() : "CLIENTE WEB")
                .numeroOperacion(numeroOperacion != null ? numeroOperacion.trim() : null)
                .metodoPago(metodo)
                .tipoAtencion(tipo)
                .montoTotal(Math.round(totalReal * 100.0) / 100.0)
                .detallePedidoJson(objectMapper.writeValueAsString(itemsCarrito))
                .situacion(SituacionPagoDigital.PENDIENTE)
                .observacion("Pendiente de verificación manual en caja.")
                .imgUrl(imgUrl)
                .build();

        PagoDigital guardado = pagoDigitalRepository.save(pago);

        // Disparar notificación operativa para Caja y Administración
        notificacionService.crear(
                "PAGO_DIGITAL",
                "Nuevo comprobante " + metodo + " #" + guardado.getId() + " por S/ " + String.format("%.2f", guardado.getMontoTotal()) + " (" + guardado.getClienteNombre() + ")",
                "CAJERO",
                "/admin/pagos-digitales",
                guardado.getId()
        );

        return guardado.getId();
    }

    @Transactional
    public Long recibirPedidoCarta(Venta venta, String urlVoucher) {
        String metodo = venta.getMetodoPago() != null ? venta.getMetodoPago().name() : "EFECTIVO";
        venta.setEstadoPago(EstadoPago.PENDIENTE);
        venta.setFechaVenta(LocalDateTime.now());

        if (venta.getDetalles() != null) {
            venta.getDetalles().forEach(detalle -> detalle.setVenta(venta));
        }

        Venta ventaGuardada = ventaRepository.save(venta);

        if ("YAPE".equalsIgnoreCase(metodo) || "PLIN".equalsIgnoreCase(metodo) || "TRANSFERENCIA".equalsIgnoreCase(metodo)) {
            PagoDigital pagoDigital = new PagoDigital();
            pagoDigital.setVenta(ventaGuardada);
            pagoDigital.setFechaPago(LocalDateTime.now());
            pagoDigital.setSituacion(SituacionPagoDigital.PENDIENTE);
            pagoDigital.setObservacion("Voucher en espera de confirmación de cajero.");
            pagoDigital.setImgUrl(urlVoucher);

            pagoDigitalRepository.save(pagoDigital);
        }

        return ventaGuardada.getId();
    }
}