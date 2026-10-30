package com.web.restaurante.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.web.restaurante.model.caja.CierreCajaSerie;

import java.util.Optional;

@Repository
public interface CierreCajaSerieRepository extends JpaRepository<CierreCajaSerie, Long> {

    @Query(value = "SELECT * FROM cierre_caja_serie WHERE serie = :serie FOR UPDATE", nativeQuery = true)
    Optional<CierreCajaSerie> findBySerieConBloqueoNativo(@Param("serie") String serie);
}