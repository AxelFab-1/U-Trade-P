package com.example.umarket.repository;

import com.example.umarket.model.Favorito;
import com.example.umarket.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    @Query("SELECT f.producto FROM Favorito f WHERE f.usuario.id = :usuarioId ORDER BY f.fechaCreacion DESC")
    List<Producto> findProductosFavoritosByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT f.producto.id FROM Favorito f WHERE f.usuario.id = :usuarioId")
    List<Long> findProductoIdsFavoritosByUsuarioId(@Param("usuarioId") Long usuarioId);

    boolean existsByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    Optional<Favorito> findByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    @Modifying
    @Query("DELETE FROM Favorito f WHERE f.usuario.id = :usuarioId AND f.producto.id = :productoId")
    void deleteByUsuarioIdAndProductoId(@Param("usuarioId") Long usuarioId, @Param("productoId") Long productoId);

    @Modifying
    @Query("DELETE FROM Favorito f WHERE f.producto.id = :productoId")
    void deleteByProductoId(@Param("productoId") Long productoId);

    @Modifying
    @Query("DELETE FROM Favorito f WHERE f.usuario.id = :usuarioId")
    void deleteByUsuarioId(@Param("usuarioId") Long usuarioId);
}
