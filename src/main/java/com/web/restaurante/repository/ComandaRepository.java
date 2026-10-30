package com.web.restaurante.repository;

import com.web.restaurante.model.Comanda;
import com.web.restaurante.model.enums.EstadoComanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComandaRepository extends JpaRepository<Comanda, Long> {
    Optional<Comanda> findByNumeroMesa(Integer numeroMesa);
    List<Comanda> findByEstado(EstadoComanda estado);

    @Query("SELECT DISTINCT c FROM Comanda c JOIN c.detalles d WHERE d.pagado = false AND d.canceladoPorCliente = false")
    List<Comanda> findComandasConItemsPendientesPago();
}