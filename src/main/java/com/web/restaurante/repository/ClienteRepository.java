package com.web.restaurante.repository;

import com.web.restaurante.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByEstado(Integer estado, Pageable pageable);
    Page<Cliente> findByEstadoNot(Integer estado, Pageable pageable);

    Optional<Cliente> findByDniAndEstado(String dni, Integer estado);
    Optional<Cliente> findByTelefonoAndEstado(String telefono, Integer estado);
    Optional<Cliente> findByCorreoAndEstado(String correo, Integer estado);

    Optional<Cliente> findByIdAndEstado(Long id, Integer estado);
    Optional<Cliente> findByIdAndEstadoNot(Long id, Integer estado);

    @Query("""
        SELECT c FROM Cliente c
        WHERE c.estado = :estado AND (
            LOWER(c.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(c.apellido) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR c.dni LIKE CONCAT('%', :texto, '%')
            OR c.telefono LIKE CONCAT('%', :texto, '%')
            OR LOWER(c.correo) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        """)
    Page<Cliente> buscarPorEstado(
            @Param("estado") Integer estado,
            @Param("texto") String texto,
            Pageable pageable
    );

    @Query("""
        SELECT c FROM Cliente c
        WHERE c.estado != :estado AND (
            LOWER(c.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(c.apellido) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR c.dni LIKE CONCAT('%', :texto, '%')
            OR c.telefono LIKE CONCAT('%', :texto, '%')
            OR LOWER(c.correo) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        """)
    Page<Cliente> buscarPorEstadoNot(
            @Param("estado") Integer estado,
            @Param("texto") String texto,
            Pageable pageable
    );
}
