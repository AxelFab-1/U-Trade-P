package com.example.umarket.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        String primerMensaje = "Datos de entrada inválidos";

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            if (!errores.containsKey(error.getField())) {
                errores.put(error.getField(), error.getDefaultMessage());
            }
        }

        if (!ex.getBindingResult().getFieldErrors().isEmpty()) {
            FieldError primerError = ex.getBindingResult().getFieldErrors().get(0);
            if (primerError.getDefaultMessage() != null) {
                primerMensaje = primerError.getDefaultMessage();
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("mensaje", primerMensaje);
        body.put("message", primerMensaje);
        body.put("errores", errores);

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("mensaje", "Formato de datos inválido en la solicitud");
        body.put("message", "Formato de datos inválido en la solicitud");
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        String motivo = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("mensaje", motivo);
        body.put("message", motivo);
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
}
