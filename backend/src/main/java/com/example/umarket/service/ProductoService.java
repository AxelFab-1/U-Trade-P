package com.example.umarket.service;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.PedidoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductoService {
    
    private final ProductoRepository repository;
    private final UsuarioRepository usuarioRepository; 
    private final PedidoRepository pedidoRepository;

    public ProductoService(ProductoRepository repository, 
                           UsuarioRepository usuarioRepository,
                           PedidoRepository pedidoRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
    }

    public List<Producto> listarTodos() {
        return repository.findAll();
    }

    public Producto buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }

    public List<Producto> buscarPorCategoria(String categoria) {
        return repository.findByCategoria(categoria);
    }

    public List<Producto> buscarPorVendedor(Long usuarioId) {
        return repository.findByVendedorId(usuarioId);
    }

    @Transactional
    public Producto guardarProducto(Producto p) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            Usuario vendedor = usuarioRepository.findByCorreoIgnoreCase(auth.getName()).orElse(null);
            if (vendedor != null) {
                p.setVendedor(vendedor);
            }
        }
        if (p.getStock() == null || p.getStock() < 1) {
            p.setStock(1);
        }
        if (p.getDisponible() == null) {
            p.setDisponible(true);
        }
        return repository.save(p);
    }
    
    @Transactional
    public Producto actualizarProducto(Long id, Producto p) {
        return repository.findById(id).map(productoExistente -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String correoAutenticado = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
            boolean esAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!esAdmin && correoAutenticado != null && !"anonymousUser".equals(correoAutenticado)) {
                if (productoExistente.getVendedor() != null && !productoExistente.getVendedor().getCorreo().equalsIgnoreCase(correoAutenticado)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar una publicación que no te pertenece.");
                }
            }

            if (p.getNombre() != null && !p.getNombre().trim().isEmpty()) {
                productoExistente.setNombre(p.getNombre().trim());
            }
            if (p.getPrecio() != null && p.getPrecio() > 0) {
                productoExistente.setPrecio(p.getPrecio());
            }
            if (p.getCategoria() != null && !p.getCategoria().trim().isEmpty()) {
                productoExistente.setCategoria(p.getCategoria().trim());
            }
            if (p.getDescripcion() != null && !p.getDescripcion().trim().isEmpty()) {
                productoExistente.setDescripcion(p.getDescripcion().trim());
            }
            if (p.getFoto() != null && !p.getFoto().trim().isEmpty()) {
                productoExistente.setFoto(p.getFoto().trim());
            }
            if (p.getStock() != null) {
                productoExistente.setStock(Math.max(0, p.getStock()));
            }
            if (p.getDisponible() != null) {
                productoExistente.setDisponible(p.getDisponible());
            }
            if (p.getVendedor() != null) {
                productoExistente.setVendedor(p.getVendedor());
            }
            return repository.save(productoExistente);
        }).orElse(null); 
    }

    @Transactional
    public boolean eliminarProducto(Long id) {
        Producto producto = repository.findById(id).orElse(null);
        if (producto == null) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correoAutenticado = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        boolean esAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!esAdmin) {
            if (correoAutenticado == null || "anonymousUser".equals(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para eliminar una publicación");
            }
            if (producto.getVendedor() != null && !producto.getVendedor().getCorreo().equalsIgnoreCase(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes borrar un producto que no te pertenece");
            }
        }

        // Eliminar pedidos asociados para no violar la integridad referencial
        pedidoRepository.deleteByProductoId(id);

        repository.delete(producto);
        return true;
    }

    @Transactional
    public Producto cambiarDisponibilidad(Long id, Boolean estadoDeseado) {
        Producto producto = repository.findById(id).orElse(null);
        if (producto == null) {
            return null;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correoAutenticado = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        boolean esAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!esAdmin && correoAutenticado != null && !"anonymousUser".equals(correoAutenticado)) {
            if (producto.getVendedor() != null && !producto.getVendedor().getCorreo().equalsIgnoreCase(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar una publicación ajena.");
            }
        }

        boolean nuevoEstado = (estadoDeseado != null) ? estadoDeseado : (producto.getDisponible() == null || !producto.getDisponible());
        producto.setDisponible(nuevoEstado);
        return repository.save(producto);
    }

    // --- TRANSACCIÓN ACID: Compra de Producto ---
    @Transactional
    public Producto comprarProducto(Long id) {
        Producto producto = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (producto.getDisponible() != null && !producto.getDisponible()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lo sentimos, esta publicación no está disponible o se encuentra pausada temporalmente.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correoComprador = auth.getName();

        if (producto.getVendedor() != null && producto.getVendedor().getCorreo().equalsIgnoreCase(correoComprador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes comprar tu propia publicación.");
        }

        Usuario comprador = usuarioRepository.findByCorreoIgnoreCase(correoComprador)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprador no encontrado en la base de datos"));

        producto.setDisponible(false); 
        producto.setComprador(comprador); 

        return repository.save(producto);
    }
}
