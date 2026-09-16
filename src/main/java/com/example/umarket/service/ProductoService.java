package com.example.umarket.service;

import com.example.umarket.model.Producto;
import com.example.umarket.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {
    
    private final ProductoRepository repository;

    public ProductoService(ProductoRepository repository) {
        this.repository = repository;
    }

    public List<Producto> listarTodos() {
        return repository.findAll();
    }

    public Producto guardarProducto(Producto p) {
        return repository.save(p);
    }
    
    public Producto actualizarProducto(Long id, Producto p) {
        return repository.update(id, p);
    }

    public boolean eliminarProducto(Long id) {
        return repository.deleteById(id);
    }

    public List<Producto> buscarPorCategoria(String categoria) {
        return repository.findByCategoria(categoria);
    }
    
public Producto buscarPorId(Long id) {
    return repository.findById(id).orElse(null);
}

}