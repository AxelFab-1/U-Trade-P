package com.example.umarket.controller;

import com.example.umarket.model.Usuario;
import com.example.umarket.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


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
    public ResponseEntity<Usuario> crear(@RequestBody Usuario u) {
        Usuario creado = service.guardarUsuario(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Usuario> actualizar(@PathVariable Long id, @RequestBody Usuario u) {
        Usuario usuarioActualizado = service.actualizarUsuario(id, u);
        if (usuarioActualizado == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(usuarioActualizado)    ;
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (service.eliminarUsuario(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
