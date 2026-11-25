package com.example.umarket.repository;

import com.example.umarket.model.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {
    List<Reporte> findAllByOrderByFechaCreacionDesc();
    List<Reporte> findByProductoId(Long productoId);
    void deleteByProductoId(Long productoId);
    void deleteByUsuarioDenuncianteId(Long usuarioDenuncianteId);
    boolean existsByProductoIdAndUsuarioDenuncianteIdAndEstado(Long productoId, Long usuarioDenuncianteId, String estado);
}
