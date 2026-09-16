package com.example.umarket.model;

public record Producto(
    Long id,
    String nombre,
    Double precio,
    String categoria,
    String descripcion,
    String foto
) {}
