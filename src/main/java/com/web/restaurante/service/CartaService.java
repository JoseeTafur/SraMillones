package com.web.restaurante.service;

import com.web.restaurante.model.Categoria;
import com.web.restaurante.model.PagoDigital;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.Producto;
import com.web.restaurante.repository.CategoriaRepository;
import com.web.restaurante.repository.PagoDigitalRepository;
import com.web.restaurante.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CartaService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final PagoDigitalRepository pagoDigitalRepository;
    private final PedidoService pedidoService;

    public List<Categoria> categoria(){
        return categoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<Long, Boolean> productosAgotados() {

        List<Producto> listaProductos = productoRepository.findByEstado(1);
        Map<Long, Boolean> productosAgotados = new HashMap<>();

        // Sin gestión de stock, todos los productos están disponibles por defecto (false = no agotado)
        for (Producto p : listaProductos) {
            productosAgotados.put(p.getId(), false);
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
