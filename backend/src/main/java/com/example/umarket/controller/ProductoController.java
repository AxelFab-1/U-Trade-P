package com.example.umarket.controller;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.UsuarioRepository;
import com.example.umarket.service.ProductoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController 
@RequestMapping("/api/productos") 
public class ProductoController {
    
    private final ProductoService service;
    private final UsuarioRepository usuarioRepository;
    
    public ProductoController(ProductoService service, UsuarioRepository usuarioRepository) {
        this.service = service;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Producto>> buscarPorCategoria(@RequestParam String categoria) {
        return ResponseEntity.ok(service.buscarPorCategoria(categoria));
    }
    
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<Producto> buscarPorId(@PathVariable Long id) {
        Producto producto = service.buscarPorId(id);
        if (producto == null) {
            return ResponseEntity.notFound().build(); 
        }
        return ResponseEntity.ok(producto); 
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Producto p) {
        if (p.getNombre() == null || p.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: El título del producto es obligatorio.");
        }
        if (p.getPrecio() == null || p.getPrecio() <= 0) {
            return ResponseEntity.badRequest().body("Error: El precio debe ser mayor a 0.");
        }
        if (p.getCategoria() == null || p.getCategoria().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: La categoría es obligatoria.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debes iniciar sesión para publicar.");
        }

        Usuario vendedor = usuarioRepository.findByCorreoIgnoreCase(auth.getName()).orElse(null);
        if (vendedor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Vendedor no encontrado.");
        }

        boolean perfilIncompleto = vendedor.getTelefono() == null || vendedor.getTelefono().trim().isEmpty()
                || vendedor.getCampus() == null || vendedor.getCampus().trim().isEmpty()
                || vendedor.getCarrera() == null || vendedor.getCarrera().trim().isEmpty();

        if (perfilIncompleto) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                    .body("Debes completar tus datos en tu perfil (teléfono, campus y carrera) antes de publicar un producto.");
        }

        p.setVendedor(vendedor);
        Producto creado = service.guardarProducto(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Producto p) {
        if (p.getNombre() == null || p.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: El nombre del producto es obligatorio.");
        }
        if (p.getPrecio() == null || p.getPrecio() <= 0) {
            return ResponseEntity.badRequest().body("Error: El precio debe ser mayor a 0.");
        }
        if (p.getCategoria() == null || p.getCategoria().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: La categoría es obligatoria.");
        }

        Producto actualizado = service.actualizarProducto(id, p);
        if (actualizado == null) {
            return ResponseEntity.notFound().build(); 
        }
        return ResponseEntity.ok(actualizado); 
    }

    @PatchMapping("/{id:[0-9]+}/disponibilidad")
    public ResponseEntity<?> cambiarDisponibilidad(@PathVariable Long id, @RequestBody(required = false) Map<String, Boolean> body) {
        Boolean estadoDeseado = (body != null && body.containsKey("disponible")) ? body.get("disponible") : null;
        Producto actualizado = service.cambiarDisponibilidad(id, estadoDeseado);
        if (actualizado == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (service.eliminarProducto(id)) {
            return ResponseEntity.noContent().build(); 
        }
        return ResponseEntity.notFound().build(); 
    }

    @GetMapping("/vendedor/{usuarioId}")
    public ResponseEntity<List<Producto>> buscarPorVendedor(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.buscarPorVendedor(usuarioId));
    }

    // --- ENDPOINT TRANSACCIONAL DE COMPRA ---
    @PostMapping("/{id:[0-9]+}/comprar")
    public ResponseEntity<Producto> comprar(@PathVariable Long id) {
        Producto productoComprado = service.comprarProducto(id);
        return ResponseEntity.ok(productoComprado);
    }
}
