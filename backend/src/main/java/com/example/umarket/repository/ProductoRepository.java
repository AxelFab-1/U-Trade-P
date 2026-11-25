package com.example.umarket.repository;

import com.example.umarket.model.Producto;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByCategoria(String categoria);

    @Query("SELECT p FROM Producto p WHERE p.vendedor.id = :usuarioId")
    List<Producto> findByVendedorId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT p FROM Producto p WHERE p.comprador.id = :usuarioId")
    List<Producto> findByCompradorId(@Param("usuarioId") Long usuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")})
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT p FROM Producto p WHERE " +
           "LOWER(p.categoria) = LOWER(:categoria) AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :termino, '%'))) AND " +
           "(p.disponible IS NULL OR p.disponible = true) AND " +
           "(p.stock IS NULL OR p.stock > 0) AND " +
           "p.comprador IS NULL " +
           "ORDER BY p.fechaPublicacion DESC")
    List<Producto> buscarPorCategoriaYTermino(@Param("categoria") String categoria, @Param("termino") String termino);

    @Query("SELECT p FROM Producto p WHERE " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :termino, '%'))) AND " +
           "(p.disponible IS NULL OR p.disponible = true) AND " +
           "(p.stock IS NULL OR p.stock > 0) AND " +
           "p.comprador IS NULL " +
           "ORDER BY p.fechaPublicacion DESC")
    List<Producto> buscarPorTermino(@Param("termino") String termino);

    @Query("SELECT p FROM Producto p WHERE " +
           "LOWER(p.categoria) = LOWER(:categoria) AND " +
           "(p.disponible IS NULL OR p.disponible = true) AND " +
           "(p.stock IS NULL OR p.stock > 0) AND " +
           "p.comprador IS NULL " +
           "ORDER BY p.fechaPublicacion DESC")
    List<Producto> listarPorCategoriaDisponibles(@Param("categoria") String categoria);

    @Query("SELECT p FROM Producto p WHERE " +
           "(p.disponible IS NULL OR p.disponible = true) AND " +
           "(p.stock IS NULL OR p.stock > 0) AND " +
           "p.comprador IS NULL " +
           "ORDER BY p.fechaPublicacion DESC")
    List<Producto> listarTodosDisponibles();
}
