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







    
    //Anotación de Sprng
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
    public ResponseEntity<Producto> crear(@RequestBody Producto p) {
        Producto creado = service.guardarProducto(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Producto> actualizar(@PathVariable Long id, @RequestBody Producto p) {
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
}