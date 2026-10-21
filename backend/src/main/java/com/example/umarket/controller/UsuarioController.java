package com.example.umarket.controller;

import com.example.umarket.model.Usuario;
import com.example.umarket.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
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
    public ResponseEntity<?> crear(@RequestBody Usuario u) {
        if (u.getNombre() == null || u.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: El nombre es obligatorio.");
        }

        if (u.getCorreo() == null || !u.getCorreo().toLowerCase().endsWith("@utp.edu.pe")) {
            return ResponseEntity.badRequest().body("Error: Solo se permiten correos institucionales de la UTP (@utp.edu.pe).");
        }
        
        if (u.getPassword() == null || u.getPassword().trim().length() < 4) {
            return ResponseEntity.badRequest().body("Error: La contraseña es obligatoria y debe tener al menos 4 caracteres.");
        }

        u.setRol("ESTUDIANTE");

        Usuario creado = service.guardarUsuario(u);
        creado.setPassword(null);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Usuario u) {
        if (u.getNombre() == null || u.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: El nombre es obligatorio.");
        }
        if (u.getCorreo() == null || !u.getCorreo().toLowerCase().endsWith("@utp.edu.pe")) {
            return ResponseEntity.badRequest().body("Error: Solo se permiten correos institucionales de la UTP (@utp.edu.pe).");
        }
        if (u.getPassword() == null || u.getPassword().trim().length() < 4) {
            return ResponseEntity.badRequest().body("Error: La contraseña es obligatoria y debe tener al menos 4 caracteres.");
        }

        Usuario usuarioActualizado = service.actualizarUsuario(id, u);
        if (usuarioActualizado == null) {
            return ResponseEntity.notFound().build();
        }
        
        usuarioActualizado.setPassword(null);
        return ResponseEntity.ok(usuarioActualizado);
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (service.eliminarUsuario(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
