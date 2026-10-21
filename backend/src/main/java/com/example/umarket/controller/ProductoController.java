package com.example.umarket.controller;

import com.example.umarket.model.Producto;
import com.example.umarket.service.ProductoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController 
@RequestMapping("/api/productos") 
public class ProductoController {
    
    private final ProductoService service;
    
    public ProductoController(ProductoService service) {
        this.service = service;
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
            return ResponseEntity.badRequest().body("Error: El nombre del producto es obligatorio.");
        }
        if (p.getPrecio() == null || p.getPrecio() <= 0) {
            return ResponseEntity.badRequest().body("Error: El precio debe ser mayor a 0.");
        }
        if (p.getCategoria() == null || p.getCategoria().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: La categoría es obligatoria.");
        }
        
        if (p.getVendedor() == null || p.getVendedor().getId() == null) {
            return ResponseEntity.badRequest().body("Error: Todo producto debe estar asociado a un vendedor (ID de usuario).");
        }

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