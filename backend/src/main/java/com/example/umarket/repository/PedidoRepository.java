package com.example.umarket.repository;

import com.example.umarket.model.Pedido;
import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByCompradorOrderByFechaDesc(Usuario comprador);
    List<Pedido> findByVendedorOrderByFechaDesc(Usuario vendedor);

    @Query("SELECT p FROM Pedido p WHERE p.vendedor.id = :vendedorId")
    List<Pedido> findByVendedorId(@Param("vendedorId") Long vendedorId);

    @Modifying
    @Query("DELETE FROM Pedido p WHERE p.comprador.id = :compradorId")
    void deleteByCompradorId(@Param("compradorId") Long compradorId);

    @Modifying
    @Query("DELETE FROM Pedido p WHERE p.producto.id = :productoId")
    void deleteByProductoId(@Param("productoId") Long productoId);

    @Query("SELECT COUNT(p) > 0 FROM Pedido p WHERE p.producto.id = :productoId")
    boolean existsByProductoId(@Param("productoId") Long productoId);

    void deleteByProducto(Producto producto);
}
