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
import java.util.Set;
import org.springframework.web.server.ResponseStatusException;

@RestController 
@RequestMapping("/api/productos") 
public class ProductoController {
    
    private final ProductoService service;
    private final UsuarioRepository usuarioRepository;
    
    public static final Set<String> CATEGORIAS_VALIDAS = Set.of("Producto", "Comida", "Servicios");

    public ProductoController(ProductoService service, UsuarioRepository usuarioRepository) {
        this.service = service;
        this.usuarioRepository = usuarioRepository;
    }

    private String normalizarCategoria(String cat) {
        if (cat == null) return null;
        String trimmed = cat.trim();
        for (String valid : CATEGORIAS_VALIDAS) {
            if (valid.equalsIgnoreCase(trimmed)) {
                return valid;
            }
        }
        return null;
    }

    private void validarDatosProducto(Producto p, boolean esCreacion) {
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del producto son obligatorios.");
        }
        if (p.getNombre() == null || p.getNombre().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título del producto es obligatorio (mínimo 3 caracteres).");
        }
        if (p.getPrecio() == null || p.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor a 0.");
        }
        String categoriaNormalizada = normalizarCategoria(p.getCategoria());
        if (categoriaNormalizada == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es inválida. Debe ser: Producto, Comida o Servicios.");
        }
        p.setCategoria(categoriaNormalizada);

        if (esCreacion) {
            if (p.getStock() == null || p.getStock() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock inicial debe ser al menos 1 unidad.");
            }
        } else {
            if (p.getStock() != null && p.getStock() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock no puede ser negativo.");
            }
        }

        if (p.getFoto() != null && !p.getFoto().trim().isEmpty()) {
            String fotoLower = p.getFoto().trim().toLowerCase();
            if (!fotoLower.startsWith("http://") && !fotoLower.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La URL de la foto debe comenzar con http:// o https://");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Producto>> buscar(
            @RequestParam(required = false) String termino,
            @RequestParam(required = false) String categoria) {
        return ResponseEntity.ok(service.buscar(termino, categoria));
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
        validarDatosProducto(p, true);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("mensaje", "Debes iniciar sesión para publicar."));
        }

        Usuario vendedor = usuarioRepository.findByCorreoIgnoreCase(auth.getName()).orElse(null);
        if (vendedor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", "Vendedor no encontrado."));
        }

        boolean perfilIncompleto = vendedor.getTelefono() == null || vendedor.getTelefono().trim().isEmpty()
                || vendedor.getCampus() == null || vendedor.getCampus().trim().isEmpty()
                || vendedor.getCarrera() == null || vendedor.getCarrera().trim().isEmpty();

        if (perfilIncompleto) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                    .body(Map.of("mensaje", "Debes completar tus datos en tu perfil (teléfono, campus y carrera) antes de publicar un producto."));
        }

        p.setVendedor(vendedor);
        Producto creado = service.guardarProducto(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Producto p) {
        validarDatosProducto(p, false);

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
