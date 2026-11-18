package com.example.umarket.service;

import com.example.umarket.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CodigoVerificacionService {

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    private static class EntradaCodigo {
        final String codigo;
        final long expiraEn;

        EntradaCodigo(String codigo, long expiraEn) {
            this.codigo = codigo;
            this.expiraEn = expiraEn;
        }
    }

    // Memoria concurrente para almacenar códigos con TTL de 10 minutos
    private final Map<String, EntradaCodigo> codigosPorCorreo = new ConcurrentHashMap<>();

    public CodigoVerificacionService(EmailService emailService, UsuarioRepository usuarioRepository) {
        this.emailService = emailService;
        this.usuarioRepository = usuarioRepository;
    }

    public void generarYEnviarCodigo(String correo, String nombre) {
        if (nombre == null || !nombre.trim().matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,60}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "El nombre solo debe contener letras y espacios (entre 3 y 60 caracteres), sin números ni símbolos.");
        }

        if (correo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo institucional es obligatorio.");
        }

        String correoLimpio = correo.trim().toLowerCase();
        if (!correoLimpio.matches("^[a-zA-Z0-9._%+-]+@utp\\.edu\\.pe$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Solo se permiten correos institucionales válidos de la UTP (@utp.edu.pe).");
        }

        // Validar que el correo no esté ya registrado
        if (usuarioRepository.findByCorreo(correoLimpio).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Este correo institucional ya está registrado en U-Market. Inicia sesión.");
        }

        // Generar código numérico aleatorio de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(1000000));
        long expiraEn = System.currentTimeMillis() + (10 * 60 * 1000); // 10 minutos

        codigosPorCorreo.put(correoLimpio, new EntradaCodigo(codigo, expiraEn));

        // Enviar por correo SMTP oficial de Google
        emailService.enviarCodigoVerificacion(correoLimpio, nombre.trim(), codigo);
    }

    public boolean validarYConsumir(String correo, String codigoIngresado) {
        if (correo == null || codigoIngresado == null) {
            return false;
        }

        String correoLimpio = correo.trim().toLowerCase();
        String codigoLimpio = codigoIngresado.trim();

        EntradaCodigo entrada = codigosPorCorreo.get(correoLimpio);
        if (entrada == null) {
            return false;
        }

        // Verificar si expiró
        if (System.currentTimeMillis() > entrada.expiraEn) {
            codigosPorCorreo.remove(correoLimpio);
            return false;
        }

        // Verificar coincidencia
        if (entrada.codigo.equals(codigoLimpio)) {
            // Código de un solo uso
            codigosPorCorreo.remove(correoLimpio);
            return true;
        }

        return false;
    }
}
