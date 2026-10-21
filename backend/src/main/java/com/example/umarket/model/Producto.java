package com.example.umarket.model;

import jakarta.persistence.*;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private Double precio;
    private String categoria;
    private String descripcion;
    private String foto;
    
    private Boolean disponible = true;

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;
    
    @ManyToOne
    @JoinColumn(name = "comprador_id")
    private Usuario comprador;

    public Producto() {
    }

    public Producto(String nombre, Double precio, String categoria, String descripcion, String foto, Usuario vendedor) {
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria;
        this.descripcion = descripcion;
        this.foto = foto;
        this.vendedor = vendedor;
        this.disponible = true; 
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    
    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
    
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    
    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }
    
    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }
    
    public Usuario getVendedor() { return vendedor; }
    public void setVendedor(Usuario vendedor) { this.vendedor = vendedor; }
    
    public Usuario getComprador() { return comprador; }
    public void setComprador(Usuario comprador) { this.comprador = comprador; }
}
