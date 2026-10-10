package com.web.restaurante.service;

import com.web.restaurante.model.Categoria;
import com.web.restaurante.model.PagoDigital;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.Producto;
import com.web.restaurante.repository.CategoriaRepository;
import com.web.restaurante.repository.InsumoProductoRepository;
import com.web.restaurante.repository.PagoDigitalRepository;
import com.web.restaurante.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CartaService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final InsumoProductoRepository insumoProductoRepository;
    private final PagoDigitalRepository pagoDigitalRepository;
    private final PedidoService pedidoService;

    public List<Categoria> categoria(){
        return categoriaRepository.findAll();
    }

    @Transactional
    public Map<Long, Boolean> productosAgotados(){

        List<Producto> listaProductos = productoRepository.findByEstado(1);
        Map<Long, Boolean> productosAgotados = new HashMap<>();

        for (Producto p : listaProductos) {
            boolean agotado = insumoProductoRepository.findByProductoId(p.getId()).stream()
                    .anyMatch(ip -> ip.getInsumo() != null && "PROTEINA".equalsIgnoreCase(ip.getInsumo().getCategoria())
                            && (ip.getInsumo().getStockActual() != null ? ip.getInsumo().getStockActual() : 0.0) < (ip.getCantidadUsada() != null ? ip.getCantidadUsada() : 0.0));
            productosAgotados.put(p.getId(), agotado);
        }

        return productosAgotados;
    }

    public List<Producto> productos(){
        return productoRepository.findAll();
    }

    @Transactional
    public Long recibirPedidoCarta(Pedido pedido){

        String metodo = pedido.getMetodoPago() != null ? pedido.getMetodoPago().name() : "EFECTIVO";
        pedido.setEstado(com.web.restaurante.model.enums.EstadoPedido.PENDIENTE);
        pedido.setEstadoPago(com.web.restaurante.model.enums.EstadoPago.PENDIENTE);

        pedido.setFechaCreacion(java.time.LocalDateTime.now());
        pedido.setTicketImpresoCocina(false);

        Long idPedido = pedidoService.guardarPedidoCarta(pedido);
        Pedido pedidoGuardado = pedidoService.obtenerPorId(idPedido);

        if ("YAPE".equalsIgnoreCase(metodo) || "PLIN".equalsIgnoreCase(metodo) || "TRANSFERENCIA".equalsIgnoreCase(metodo)) {
            PagoDigital pagoDigital = new PagoDigital();
            pagoDigital.setPedido(pedidoGuardado);
            pagoDigital.setFechaPago(java.time.LocalDateTime.now());

            pagoDigital.setSituacion(com.web.restaurante.model.enums.SituacionPagoDigital.PENDIENTE);

            pagoDigital.setObservacion("Voucher en espera de confirmación de cajero.");

            pagoDigital.setImgUrl(pedido.getTextoVoucherCrudo());

            pagoDigitalRepository.save(pagoDigital);
        }
        return idPedido;
    }

}
