package com.example.umarket.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "comprador_id", nullable = false)
    private Usuario comprador;

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;

    private Integer cantidad;
    private Double montoTotal;
    private String metodoPago;
    private String celularComprador;
    private String numeroTransaccion;
    private String estado;
    private LocalDateTime fecha;

    public Pedido() {
        this.fecha = LocalDateTime.now();
        this.metodoPago = "YAPE";
        this.estado = "PAGADO";
    }

    public Pedido(Producto producto, Usuario comprador, Usuario vendedor, Integer cantidad, 
                  Double montoTotal, String celularComprador, String numeroTransaccion) {
        this.producto = producto;
        this.comprador = comprador;
        this.vendedor = vendedor;
        this.cantidad = cantidad;
        this.montoTotal = montoTotal;
        this.metodoPago = "YAPE";
        this.celularComprador = celularComprador;
        this.numeroTransaccion = numeroTransaccion;
        this.estado = "PAGADO";
        this.fecha = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Usuario getComprador() { return comprador; }
    public void setComprador(Usuario comprador) { this.comprador = comprador; }

    public Usuario getVendedor() { return vendedor; }
    public void setVendedor(Usuario vendedor) { this.vendedor = vendedor; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Double getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Double montoTotal) { this.montoTotal = montoTotal; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getCelularComprador() { return celularComprador; }
    public void setCelularComprador(String celularComprador) { this.celularComprador = celularComprador; }

    public String getNumeroTransaccion() { return numeroTransaccion; }
    public void setNumeroTransaccion(String numeroTransaccion) { this.numeroTransaccion = numeroTransaccion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
