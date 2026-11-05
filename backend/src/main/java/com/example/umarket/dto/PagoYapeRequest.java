package com.example.umarket.dto;

public class PagoYapeRequest {
    private Long productoId;
    private Integer cantidad;
    private String celular;
    private String codigoAprobacion;

    public PagoYapeRequest() {}

    public PagoYapeRequest(Long productoId, Integer cantidad, String celular, String codigoAprobacion) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.celular = celular;
        this.codigoAprobacion = codigoAprobacion;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getCodigoAprobacion() { return codigoAprobacion; }
    public void setCodigoAprobacion(String codigoAprobacion) { this.codigoAprobacion = codigoAprobacion; }
}
