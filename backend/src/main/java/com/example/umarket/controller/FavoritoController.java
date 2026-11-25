package com.example.umarket.controller;

import com.example.umarket.model.Producto;
import com.example.umarket.service.FavoritoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {

    private final FavoritoService favoritoService;

    public FavoritoController(FavoritoService favoritoService) {
        this.favoritoService = favoritoService;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listarMisFavoritos() {
        return ResponseEntity.ok(favoritoService.obtenerProductosFavoritos());
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> listarMisFavoritoIds() {
        return ResponseEntity.ok(favoritoService.obtenerFavoritoIds());
    }

    @PostMapping("/{productoId:[0-9]+}/toggle")
    public ResponseEntity<Map<String, Object>> toggleFavorito(@PathVariable Long productoId) {
        return ResponseEntity.ok(favoritoService.toggleFavorito(productoId));
    }

    @GetMapping("/{productoId:[0-9]+}/check")
    public ResponseEntity<Map<String, Object>> checkFavorito(@PathVariable Long productoId) {
        boolean esFav = favoritoService.esFavorito(productoId);
        return ResponseEntity.ok(Map.of("favorito", esFav, "productoId", productoId));
    }
}
