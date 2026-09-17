package com.example.umarket.model;

public record Usuario(
    Long id,
    String nombre,
    String correo,
    String password
) {}