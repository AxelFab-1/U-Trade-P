package com.example.umarket.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reportes")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_denunciante_id", nullable = false)
    private Usuario usuarioDenunciante;

    @Column(nullable = false, length = 100)
    private String motivo;

    @Column(length = 1000)
    private String detalle;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(nullable = false, length = 30)
    private String estado = "PENDIENTE"; // PENDIENTE, REVISADO, DESCARTADO

    public Reporte() {
        this.fechaCreacion = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Reporte(Producto producto, Usuario usuarioDenunciante, String motivo, String detalle) {
        this.producto = producto;
        this.usuarioDenunciante = usuarioDenunciante;
        this.motivo = motivo;
        this.detalle = detalle;
        this.fechaCreacion = LocalDateTime.now();
        this.estado = "PENDIENTE";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Usuario getUsuarioDenunciante() { return usuarioDenunciante; }
    public void setUsuarioDenunciante(Usuario usuarioDenunciante) { this.usuarioDenunciante = usuarioDenunciante; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
