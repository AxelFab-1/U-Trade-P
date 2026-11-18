package com.example.umarket.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final String secreto;
    private final long expiracionMs;

    public JwtService(
            @Value("${jwt.secret:clave-secreta-utrade-desarrollo-web-2026-256b}") String secreto,
            @Value("${jwt.expiration-ms:3600000}") long expiracionMs) {
        this.secreto = secreto;
        this.expiracionMs = expiracionMs;
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
    }

    public String generarToken(String correo, String rol) {
        return Jwts.builder()
                .subject(correo)
                .claim("rol", rol)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiracionMs))
                .signWith(getKey())
                .compact();
    }

    public String extraerCorreo(String token) {
        return obtenerClaims(token).getSubject();
    }

    public String extraerRol(String token) {
        return obtenerClaims(token).get("rol", String.class);
    }

    public boolean esValido(String token) {
        try {
            obtenerClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
