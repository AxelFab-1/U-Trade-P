package com.example.umarket.dto;

public class RegistroUsuarioRequest {
    private String nombre;
    private String correo;
    private String password;
    private String rol;
    private String codigoVerificacion;

    public RegistroUsuarioRequest() {}

    public RegistroUsuarioRequest(String nombre, String correo, String password, String rol, String codigoVerificacion) {
        this.nombre = nombre;
        this.correo = correo;
        this.password = password;
        this.rol = rol;
        this.codigoVerificacion = codigoVerificacion;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getCodigoVerificacion() { return codigoVerificacion; }
    public void setCodigoVerificacion(String codigoVerificacion) { this.codigoVerificacion = codigoVerificacion; }
}
