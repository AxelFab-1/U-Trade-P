package com.example.umarket.repository;

import com.example.umarket.model.Pedido;
import com.example.umarket.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByCompradorOrderByFechaDesc(Usuario comprador);
    List<Pedido> findByVendedorOrderByFechaDesc(Usuario vendedor);
}
