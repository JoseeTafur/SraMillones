package com.web.restaurante.repository;

import com.web.restaurante.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByTurnoCajaId(Long idTurnoCaja);
    
    // 🟢 Método necesario para la búsqueda del detalle desde el ojito 👁️
    Optional<Venta> findByNumeroComprobante(String numeroComprobante);
}