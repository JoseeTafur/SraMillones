package com.web.restaurante.repository;

import com.web.restaurante.model.InsumoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoPrecioRepository extends JpaRepository<InsumoProducto, Long> {

    @Query("SELECT ip FROM InsumoProducto ip WHERE (ip.insumo.estado = 1 AND ip.producto.estado = 1)")
    List<InsumoProducto> listarActivos();

    @Query("SELECT ip FROM InsumoProducto ip WHERE ip.insumo.id = :insumoId")
    List<InsumoProducto> findByInsumoId(@Param("insumoId") Long insumoId);
}
