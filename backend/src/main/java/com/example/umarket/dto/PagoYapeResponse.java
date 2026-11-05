package com.example.umarket.dto;

import java.time.LocalDateTime;

public class PagoYapeResponse {
    private boolean exitoso;
    private String mensaje;
    private String numeroTransaccion;
    private Long pedidoId;
    private Double montoTotal;
    private Integer cantidad;
    private String nombreProducto;
    private LocalDateTime fecha;

    public PagoYapeResponse() {}

    public PagoYapeResponse(boolean exitoso, String mensaje, String numeroTransaccion, Long pedidoId, 
                            Double montoTotal, Integer cantidad, String nombreProducto, LocalDateTime fecha) {
        this.exitoso = exitoso;
        this.mensaje = mensaje;
        this.numeroTransaccion = numeroTransaccion;
        this.pedidoId = pedidoId;
        this.montoTotal = montoTotal;
        this.cantidad = cantidad;
        this.nombreProducto = nombreProducto;
        this.fecha = fecha;
    }

    public boolean isExitoso() { return exitoso; }
    public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getNumeroTransaccion() { return numeroTransaccion; }
    public void setNumeroTransaccion(String numeroTransaccion) { this.numeroTransaccion = numeroTransaccion; }

    public Long getPedidoId() { return pedidoId; }
    public void setPedidoId(Long pedidoId) { this.pedidoId = pedidoId; }

    public Double getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Double montoTotal) { this.montoTotal = montoTotal; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
