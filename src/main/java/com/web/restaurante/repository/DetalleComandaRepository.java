package com.web.restaurante.repository;

import com.web.restaurante.model.DetalleComanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleComandaRepository extends JpaRepository<DetalleComanda, Long> {
}