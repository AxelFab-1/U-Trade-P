package com.example.umarket.controller;

import com.example.umarket.dto.RegistroUsuarioRequest;
import com.example.umarket.model.Usuario;
import com.example.umarket.service.CodigoVerificacionService;
import com.example.umarket.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;
    private final CodigoVerificacionService codigoVerificacionService;

    public UsuarioController(UsuarioService service, CodigoVerificacionService codigoVerificacionService) {
        this.service = service;
        this.codigoVerificacionService = codigoVerificacionService;
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        Usuario usuario = service.buscarPorId(id);
        if (usuario == null) {
            return ResponseEntity.notFound().build(); 
        }
        return ResponseEntity.ok(usuario); 
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody RegistroUsuarioRequest req) {
        if (req.getNombre() == null || !req.getNombre().trim().matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,60}$")) {
            return ResponseEntity.badRequest().body("Error: El nombre completo solo debe contener letras y espacios (entre 3 y 60 caracteres), sin números ni símbolos.");
        }

        if (req.getCorreo() == null || !req.getCorreo().trim().toLowerCase().matches("^[a-zA-Z0-9._%+-]+@utp\\.edu\\.pe$")) {
            return ResponseEntity.badRequest().body("Error: Solo se permiten correos institucionales válidos de la UTP (@utp.edu.pe).");
        }
        
        if (req.getPassword() == null || req.getPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body("Error: La contraseña debe tener al menos 6 caracteres.");
        }

        // Validación estricta del código OTP enviado al correo
        if (req.getCodigoVerificacion() == null || !req.getCodigoVerificacion().trim().matches("^\\d{6}$")) {
            return ResponseEntity.badRequest().body("Error: El código de verificación de 6 dígitos es obligatorio.");
        }

        boolean esValido = codigoVerificacionService.validarYConsumir(req.getCorreo(), req.getCodigoVerificacion());
        if (!esValido) {
            return ResponseEntity.badRequest().body("Error: Código de verificación incorrecto o expirado. Solicita un nuevo código.");
        }

        Usuario u = new Usuario();
        u.setNombre(req.getNombre().trim());
        u.setCorreo(req.getCorreo().trim().toLowerCase());
        u.setPassword(req.getPassword());
        u.setRol("ESTUDIANTE");

        Usuario creado = service.guardarUsuario(u);
        creado.setPassword(null);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Usuario u) {
        if (u.getNombre() == null || !u.getNombre().trim().matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,60}$")) {
            return ResponseEntity.badRequest().body("Error: El nombre completo solo debe contener letras y espacios (entre 3 y 60 caracteres).");
        }
        if (u.getCorreo() == null || !u.getCorreo().toLowerCase().endsWith("@utp.edu.pe")) {
            return ResponseEntity.badRequest().body("Error: Solo se permiten correos institucionales de la UTP (@utp.edu.pe).");
        }
        if (u.getPassword() == null || u.getPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body("Error: La contraseña debe tener al menos 6 caracteres.");
        }

        Usuario usuarioActualizado = service.actualizarUsuario(id, u);
        if (usuarioActualizado == null) {
            return ResponseEntity.notFound().build();
        }
        
        usuarioActualizado.setPassword(null);
        return ResponseEntity.ok(usuarioActualizado);
    }

    @PostMapping("/admin")
    public ResponseEntity<?> crearAdmin(@RequestBody Usuario req) {
        if (req.getNombre() == null || !req.getNombre().trim().matches("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{3,60}$")) {
            return ResponseEntity.badRequest().body("Error: El nombre completo solo debe contener letras y espacios (entre 3 y 60 caracteres).");
        }

        if (req.getCorreo() == null || !req.getCorreo().trim().toLowerCase().matches("^[a-zA-Z0-9._%+-]+@utp\\.edu\\.pe$")) {
            return ResponseEntity.badRequest().body("Error: Solo se permiten correos institucionales de la UTP (@utp.edu.pe).");
        }

        if (req.getPassword() == null || req.getPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body("Error: La contraseña debe tener al menos 6 caracteres.");
        }

        if (service.existePorCorreo(req.getCorreo().trim().toLowerCase())) {
            return ResponseEntity.badRequest().body("Error: Ya existe un usuario registrado con este correo.");
        }

        Usuario nuevoAdmin = new Usuario();
        nuevoAdmin.setNombre(req.getNombre().trim());
        nuevoAdmin.setCorreo(req.getCorreo().trim().toLowerCase());
        nuevoAdmin.setPassword(req.getPassword());
        nuevoAdmin.setRol("ADMIN");

        Usuario creado = service.guardarUsuario(nuevoAdmin);
        creado.setPassword(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (service.eliminarUsuario(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
