package com.example.umarket.repository;

import com.example.umarket.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByCategoria(String categoria);

    @Query("SELECT p FROM Producto p WHERE p.vendedor.id = :usuarioId")
    List<Producto> findByVendedorId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT p FROM Producto p WHERE p.comprador.id = :usuarioId")
    List<Producto> findByCompradorId(@Param("usuarioId") Long usuarioId);
}
