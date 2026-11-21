package com.web.restaurante.repository;

import com.web.restaurante.model.AuditoriaEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<AuditoriaEvento, Long> {
    List<AuditoriaEvento> findTop200ByOrderByFechaHoraDesc();
}