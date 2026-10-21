package com.example.umarket.service;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
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

    public ProductoService(ProductoRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
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
        return repository.save(p);
    }
    
    @Transactional
    public Producto actualizarProducto(Long id, Producto p) {
        return repository.findById(id).map(productoExistente -> {
            productoExistente.setNombre(p.getNombre());
            productoExistente.setPrecio(p.getPrecio());
            productoExistente.setCategoria(p.getCategoria());
            productoExistente.setDescripcion(p.getDescripcion());
            productoExistente.setFoto(p.getFoto());
            productoExistente.setVendedor(p.getVendedor());
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
        String correoAutenticado = auth.getName();
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!esAdmin) {
            if (producto.getVendedor() != null && !producto.getVendedor().getCorreo().equals(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes borrar un producto que no te pertenece");
            }
        }

        repository.deleteById(id);
        return true;
    }

    // --- TRANSACCIÓN ACID: Compra de Producto ---
    @Transactional
    public Producto comprarProducto(Long id) {
        Producto producto = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (producto.getDisponible() != null && !producto.getDisponible()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lo sentimos, este producto ya fue vendido.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correoComprador = auth.getName();

        if (producto.getVendedor() != null && producto.getVendedor().getCorreo().equals(correoComprador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes comprar tu propio producto.");
        }

        Usuario comprador = usuarioRepository.findByCorreo(correoComprador)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprador no encontrado en la base de datos"));

        producto.setDisponible(false); 
        producto.setComprador(comprador); 

        return repository.save(producto);
    }
}